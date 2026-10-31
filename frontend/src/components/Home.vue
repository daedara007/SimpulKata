<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
    <!-- Ambient Background Glows -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none -z-10"></div>
    <div class="absolute top-[600px] -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
    <div class="absolute top-[1200px] -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

    <!-- Header & Navigation -->
    <HomeNavbar
      :is-authenticated="isAuthenticated"
      @navigate="(view, tab) => $emit('navigate', view, tab)"
    />

    <!-- Hero Section & Interactive Demo -->
    <HeroSection
      :is-authenticated="isAuthenticated"
      @navigate="(view, tab) => $emit('navigate', view, tab)"
    />

    <!-- Metrik & Statistik -->
    <StatsSection />

    <!-- Fitur Unggulan -->
    <FeaturesSection />

    <!-- Alur Kerja -->
    <HowItWorksSection />

    <!-- Paket Kuota -->
    <PricingSection
      :is-authenticated="isAuthenticated"
      @navigate="(view, tab) => $emit('navigate', view, tab)"
    />

    <!-- FAQ -->
    <FaqSection />

    <!-- Footer & Bottom CTA -->
    <HomeFooter
      :is-authenticated="isAuthenticated"
      @navigate="(view, tab) => $emit('navigate', view, tab)"
    />
  </div>
</template>

<script setup lang="ts">
import HomeNavbar from './home/HomeNavbar.vue';
import HeroSection from './home/HeroSection.vue';
import StatsSection from './home/StatsSection.vue';
import FeaturesSection from './home/FeaturesSection.vue';
import HowItWorksSection from './home/HowItWorksSection.vue';
import PricingSection from './home/PricingSection.vue';
import FaqSection from './home/FaqSection.vue';
import HomeFooter from './home/HomeFooter.vue';

interface Props {
  isAuthenticated?: boolean;
}

withDefaults(defineProps<Props>(), {
  isAuthenticated: false,
});

defineEmits<{
  (e: 'navigate', view: string, tab?: string): void;
}>();
</script>
