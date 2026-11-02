<template>
  <q-layout view="lHh Lpr lFf" class="bg-black text-white">
    <q-header elevated class="bg-grey-10 text-white q-py-xs" style="border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
      <q-toolbar>
        <q-avatar size="38px" class="bg-primary text-black q-mr-sm">
          <q-icon name="music_note" size="24px" />
        </q-avatar>

        <q-toolbar-title class="text-weight-bold row items-center no-wrap">
          <span>PartyPlayer</span>
          <q-badge color="primary" text-color="black" label="Spotify" class="q-ml-sm text-bold" />
        </q-toolbar-title>

        <q-space />

        <!-- User profile in header if logged in -->
        <div v-if="isAuthenticated && user" class="row items-center q-gutter-sm">
          <q-avatar size="34px" class="shadow-2">
            <img v-if="user.images && user.images.length" :src="user.images[0].url" :alt="user.display_name || 'User'" />
            <q-icon v-else name="person" />
          </q-avatar>
          <span class="text-subtitle2 gt-xs text-weight-medium">{{ user.display_name || 'Spotify User' }}</span>
          <q-btn flat round dense icon="logout" color="grey-4" @click="logout">
            <q-tooltip>Abmelden</q-tooltip>
          </q-btn>
        </div>

        <!-- Login button in header if not logged in -->
        <q-btn
          v-else-if="!isLoading"
          unelevated
          rounded
          color="primary"
          text-color="black"
          icon="login"
          label="Anmelden"
          class="text-weight-bold"
          no-caps
          @click="login"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { user, isAuthenticated, isLoading, login, logout, checkAuth } = useAuth()

onMounted(() => {
  checkAuth()
})
</script>

<style scoped>
.q-layout {
  min-height: 100vh;
}
</style>
