import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { Readable } from 'stream';
import audioController from '../src/controllers/audioController';
import userModel from '../src/models/userModel';
import aiService from '../src/services/aiService';

vi.mock('../src/models/userModel', () => {
  const mock = {
    findById: vi.fn(),
    reserveBalance: vi.fn(),
    getBalance: vi.fn(),
    addBalance: vi.fn(),
  };
  return { default: mock, userModel: mock };
});
vi.mock('../src/models/transcriptModel', () => {
  const mock = {
    createProcessing: vi.fn(),
    markCompleted: vi.fn(),
    markFailed: vi.fn(),
  };
  return { default: mock, transcriptModel: mock };
});
vi.mock('../src/models/quotaMutationModel', () => {
  const mock = { recordMutation: vi.fn() };
  return { default: mock, quotaMutationModel: mock };
});
vi.mock('../src/services/aiService', () => {
  const mock = {
    getAudioDuration: vi.fn(),
    transcribeAudio: vi.fn(),
    summarizeText: vi.fn(),
  };
  return { default: mock, aiService: mock };
});
vi.mock('../src/services/logService', () => {
  const mock = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  return { default: mock, logService: mock };
});

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

describe('White-Box: audioController.processAudio (Basis Path Testing)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('WB-AUD-01 (Path 1): mengembalikan 400 MISSING_FILE jika request tidak menyertakan multipart file', async () => {
    const req: any = { file: vi.fn().mockResolvedValue(null) };
    const reply = createMockReply();
    await audioController.processAudio(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('MISSING_FILE');
  });

  it('WB-AUD-02 (Path 2): mengembalikan 400 INVALID_FIELD jika nama field bukan "audio"', async () => {
    const req: any = {
      file: vi.fn().mockResolvedValue({ fieldname: 'video', filename: 'test.mp3' }),
    };
    const reply = createMockReply();
    await audioController.processAudio(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('INVALID_FIELD');
  });

  it('WB-AUD-03 (Path 3): mengembalikan 400 INVALID_FORMAT jika ekstensi file tidak didukung (.txt)', async () => {
    const req: any = {
      file: vi.fn().mockResolvedValue({ fieldname: 'audio', filename: 'catatan.txt' }),
    };
    const reply = createMockReply();
    await audioController.processAudio(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('INVALID_FORMAT');
  });

  it('WB-AUD-04 (Path 4): mengembalikan 400 EMPTY_FILE dan menghapus file jika ukuran file 0 bytes', async () => {
    vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined as any);
    vi.spyOn(fs.promises, 'stat').mockResolvedValue({ size: 0 } as any);
    vi.spyOn(fs.promises, 'unlink').mockResolvedValue(undefined);
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'createWriteStream').mockImplementation(() => {
      const { Writable } = require('stream');
      return new Writable({ write(_chunk: any, _enc: any, cb: any) { cb(); } });
    });

    const req: any = {
      file: vi.fn().mockResolvedValue({
        fieldname: 'audio',
        filename: 'kosong.mp3',
        file: Readable.from([]),
      }),
    };
    const reply = createMockReply();
    await audioController.processAudio(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('EMPTY_FILE');
  });

  it('WB-AUD-05 (Path 5): mengembalikan 402 INSUFFICIENT_QUOTA jika saldo user <= 0', async () => {
    vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined as any);
    vi.spyOn(fs.promises, 'stat').mockResolvedValue({ size: 1024 } as any);
    vi.spyOn(fs.promises, 'unlink').mockResolvedValue(undefined);
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'createWriteStream').mockImplementation(() => {
      const { Writable } = require('stream');
      return new Writable({ write(_chunk: any, _enc: any, cb: any) { cb(); } });
    });
    vi.mocked(userModel.findById).mockResolvedValue({ id: 'u1', balance: 0 } as any);

    const req: any = {
      user: { id: 'u1' },
      file: vi.fn().mockResolvedValue({
        fieldname: 'audio',
        filename: 'audio.mp3',
        file: Readable.from([Buffer.from('dummy-audio')]),
      }),
    };
    const reply = createMockReply();
    await audioController.processAudio(req, reply);
    expect(reply.statusCode).toBe(402);
    expect(reply.payload.code).toBe('INSUFFICIENT_QUOTA');
  });

  it('WB-AUD-06 (Path 6): mengembalikan 400 INVALID_AUDIO_FILE jika durasi lokal terdeteksi 0 detik', async () => {
    vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined as any);
    vi.spyOn(fs.promises, 'stat').mockResolvedValue({ size: 1024 } as any);
    vi.spyOn(fs.promises, 'unlink').mockResolvedValue(undefined);
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'createWriteStream').mockImplementation(() => {
      const { Writable } = require('stream');
      return new Writable({ write(_chunk: any, _enc: any, cb: any) { cb(); } });
    });
    vi.mocked(userModel.findById).mockResolvedValue({ id: 'u1', balance: 1800 } as any);
    vi.mocked(aiService.getAudioDuration).mockResolvedValue(0);

    const req: any = {
      user: { id: 'u1' },
      file: vi.fn().mockResolvedValue({
        fieldname: 'audio',
        filename: 'corrupt.mp3',
        file: Readable.from([Buffer.from('dummy')]),
      }),
    };
    const reply = createMockReply();
    await audioController.processAudio(req, reply);
    expect(reply.statusCode).toBe(400);
    expect(reply.payload.code).toBe('INVALID_AUDIO_FILE');
  });

  it('WB-AUD-07 (Path 7): mengembalikan 402 INSUFFICIENT_QUOTA jika reservasi kuota atomik gagal (durasi > saldo)', async () => {
    vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined as any);
    vi.spyOn(fs.promises, 'stat').mockResolvedValue({ size: 2048 } as any);
    vi.spyOn(fs.promises, 'unlink').mockResolvedValue(undefined);
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'createWriteStream').mockImplementation(() => {
      const { Writable } = require('stream');
      return new Writable({ write(_chunk: any, _enc: any, cb: any) { cb(); } });
    });
    vi.mocked(userModel.findById).mockResolvedValue({ id: 'u1', balance: 30 } as any);
    vi.mocked(aiService.getAudioDuration).mockResolvedValue(120);
    vi.mocked(userModel.reserveBalance).mockResolvedValue(null);
    vi.mocked(userModel.getBalance).mockResolvedValue(30);

    const req: any = {
      user: { id: 'u1' },
      file: vi.fn().mockResolvedValue({
        fieldname: 'audio',
        filename: 'panjang.mp3',
        file: Readable.from([Buffer.from('dummy')]),
      }),
    };
    const reply = createMockReply();
    await audioController.processAudio(req, reply);
    expect(reply.statusCode).toBe(402);
    expect(reply.payload.code).toBe('INSUFFICIENT_QUOTA');
    expect(aiService.transcribeAudio).not.toHaveBeenCalled();
  });
});
