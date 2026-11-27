import { describe, it, expect, vi, beforeEach } from 'vitest';
import uploadController from '../src/controllers/uploadController';
import userModel from '../src/models/userModel';

vi.mock('../src/models/userModel', () => {
  const mock = { findById: vi.fn() };
  return { default: mock, userModel: mock };
});
vi.mock('../src/models/transcriptModel', () => ({ default: {}, transcriptModel: {} }));
vi.mock('../src/models/quotaMutationModel', () => ({ default: {}, quotaMutationModel: {} }));
vi.mock('../src/services/aiService', () => ({ default: {}, aiService: {} }));
vi.mock('../src/controllers/audioController', () => ({
  safeUnlink: vi.fn(),
  runTranscriptionPipeline: vi.fn(),
}));

function createMockReply() {
  const reply: any = {
    statusCode: 200,
    payload: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(body: any) {
      this.payload = body;
      return this;
    },
  };
  return reply;
}

describe('White-Box: uploadController.initUpload (Chunked Upload 200MB)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('WB-UPL-01: mengembalikan 401 UNAUTHORIZED jika user tidak terautentikasi', async () => {
    const req: any = { body: {} };
    const reply = createMockReply();
    await uploadController.initUpload(req, reply);
    expect(reply.statusCode).toBe(401);
    expect(reply.payload.code).toBe('UNAUTHORIZED');
  });

  it('WB-UPL-02: mengembalikan 400 INVALID_FILENAME jika fileName kosong', async () => {
    const req: any = { user: { id: 'u1' }, body: { fileSize: 1000, totalChunks: 1 } };
    const reply = createMockReply();
    await uploadController.initUpload(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('INVALID_FILENAME');
  });

  it('WB-UPL-03: mengembalikan 400 INVALID_FORMAT jika ekstensi tidak didukung (.exe)', async () => {
    const req: any = {
      user: { id: 'u1' },
      body: { fileName: 'virus.exe', fileSize: 1000, totalChunks: 1 },
    };
    const reply = createMockReply();
    await uploadController.initUpload(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('INVALID_FORMAT');
  });

  it('WB-UPL-04 (BVA): mengembalikan 400 INVALID_FILE_SIZE jika fileSize > 200MB', async () => {
    const req: any = {
      user: { id: 'u1' },
      body: { fileName: 'rapat.mp3', fileSize: 201 * 1024 * 1024, totalChunks: 41 },
    };
    const reply = createMockReply();
    await uploadController.initUpload(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('INVALID_FILE_SIZE');
  });

  it('WB-UPL-05 (BVA): mengembalikan 400 INVALID_TOTAL_CHUNKS jika totalChunks > 200', async () => {
    const req: any = {
      user: { id: 'u1' },
      body: { fileName: 'rapat.mp3', fileSize: 50 * 1024 * 1024, totalChunks: 201 },
    };
    const reply = createMockReply();
    await uploadController.initUpload(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('INVALID_TOTAL_CHUNKS');
  });

  it('WB-UPL-06: mengembalikan 402 INSUFFICIENT_QUOTA jika saldo user <= 0 sebelum upload dimulai', async () => {
    vi.mocked(userModel.findById).mockResolvedValue({ id: 'u1', balance: 0 } as any);
    const req: any = {
      user: { id: 'u1' },
      body: { fileName: 'rapat.mp3', fileSize: 10 * 1024 * 1024, totalChunks: 2 },
    };
    const reply = createMockReply();
    await uploadController.initUpload(req, reply);
    expect(reply.statusCode).toBe(402);
    expect(reply.payload.code).toBe('INSUFFICIENT_QUOTA');
  });
});
