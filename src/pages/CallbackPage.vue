<template>
  <q-page class="flex flex-center q-pa-md bg-dark text-white">
    <q-card class="bg-grey-10 text-white q-pa-lg text-center shadow-10" style="max-width: 440px; width: 100%; border-radius: 16px;">
      <div v-if="loading" class="column items-center q-gutter-md">
        <q-spinner-tail color="primary" size="64px" />
        <div class="text-h6 text-weight-bold">Spotify Anmeldung wird abgeschlossen...</div>
        <div class="text-caption text-grey-5">Deine Spotify-Sitzung wird eingerichtet. Einen Moment bitte.</div>
      </div>

      <div v-else-if="error" class="column items-center q-gutter-md">
        <q-avatar size="64px" font-size="40px" color="negative" text-color="white" icon="error_outline" />
        <div class="text-h6 text-weight-bold text-negative">Anmeldung fehlgeschlagen</div>
        <div class="text-body2 text-grey-4">{{ errorMessage }}</div>
        <q-btn
          color="primary"
          text-color="dark"
          class="full-width q-mt-md text-weight-bold"
          label="Zurück zur Startseite"
          to="/"
          no-caps
        />
      </div>

      <div v-else class="column items-center q-gutter-md">
        <q-avatar size="64px" font-size="40px" color="primary" text-color="dark" icon="check_circle" />
        <div class="text-h6 text-weight-bold">Erfolgreich angemeldet!</div>
        <div class="text-caption text-grey-5">Du wirst weitergeleitet...</div>
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { handleCallbackToken } = useAuth()

const loading = ref(true)
const error = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  const token = route.query.token
  const err = route.query.error

  if (err) {
    loading.value = false
    error.value = true
    errorMessage.value = `Fehler bei der Spotify-Autorisierung: ${err}`
    return
  }

  if (!token) {
    loading.value = false
    error.value = true
    errorMessage.value = 'Kein Authentifizierungs-Token empfangen.'
    return
  }

  try {
    await handleCallbackToken(token)
    setTimeout(() => {
      router.push('/')
    }, 600)
  } catch (e) {
    loading.value = false
    error.value = true
    errorMessage.value = 'Konnte Sitzung nicht initialisieren.'
  }
})
</script>
