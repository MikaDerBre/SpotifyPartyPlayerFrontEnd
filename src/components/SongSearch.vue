<template>
  <q-card class="bg-grey-10 text-white shadow-8" style="border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08);">
    <q-card-section class="q-pa-lg">
      <div class="row items-center justify-between q-mb-md">
        <div class="text-h6 text-weight-bold row items-center">
          <q-icon name="search" color="primary" class="q-mr-sm" size="28px" />
          Song-Suche
        </div>
        <div v-if="tracks.length" class="text-caption text-grey-4">
          {{ tracks.length }} Treffer
        </div>
      </div>

      <!-- Search Input -->
      <q-input
        v-model="searchQuery"
        outlined
        dark
        dense
        color="primary"
        placeholder="Song oder Künstler suchen (Klicke zum Hinzufügen)..."
        class="bg-grey-9 text-white"
        style="border-radius: 10px;"
        :loading="isSearching"
        clearable
        @update:model-value="onInputChanged"
        @keyup.enter="triggerSearchNow"
      >
        <template #prepend>
          <q-icon name="music_note" color="primary" />
        </template>
      </q-input>

      <!-- RESULTS LIST -->
      <div class="q-mt-md">

        <!-- Loading spinner -->
        <div v-if="isSearching" class="column items-center q-py-lg q-gutter-sm">
          <q-spinner-dots color="primary" size="40px" />
          <div class="text-caption text-grey-4">Suche auf Spotify...</div>
        </div>

        <!-- Search Error -->
        <q-banner v-else-if="errorMessage" rounded class="bg-red-9 text-white q-my-sm">
          <template #avatar>
            <q-icon name="warning" />
          </template>
          {{ errorMessage }}
        </q-banner>

        <!-- Results Found -->
        <q-list v-else-if="tracks.length" separator class="q-mt-sm bg-grey-9" style="border-radius: 12px; max-height: 480px; overflow-y: auto;">
          <q-item
            v-for="track in tracks"
            :key="track.id"
            class="q-py-sm track-item"
            clickable
            @click="handleTrackClick(track)"
          >
            <!-- Album Cover -->
            <q-item-section avatar>
              <q-avatar rounded size="48px" class="bg-grey-8 shadow-2">
                <img v-if="track.album_art" :src="track.album_art" :alt="track.name" />
                <q-icon v-else name="album" color="grey-5" />
              </q-avatar>
            </q-item-section>

            <!-- Title & Artist -->
            <q-item-section>
              <q-item-label class="text-weight-bold text-subtitle2 text-white row items-center no-wrap">
                <span class="ellipsis">{{ track.name }}</span>
                <q-badge
                  v-if="track.explicit"
                  color="grey-8"
                  text-color="grey-4"
                  label="E"
                  class="q-ml-xs text-bold"
                  style="font-size: 10px; padding: 1px 4px;"
                />
              </q-item-label>
              <q-item-label caption class="text-grey-4 ellipsis">
                {{ track.artist_display }}
              </q-item-label>
              <q-item-label caption class="text-grey-6 ellipsis text-caption">
                {{ track.album_name }}
              </q-item-label>
            </q-item-section>

            <!-- Action / In Queue Status -->
            <q-item-section side class="row items-center no-wrap q-gutter-x-sm">
              <span class="text-caption text-grey-5">{{ formatDuration(track.duration_ms) }}</span>

              <template v-if="isInQueue(track.id)">
                <q-badge color="positive" text-color="black" class="q-py-xs q-px-sm text-bold">
                  <q-icon name="check" size="14px" class="q-mr-xs" />
                  In Queue ({{ getQueueVotes(track.id) }} Votes)
                </q-badge>
              </template>

              <template v-else>
                <q-btn
                  round
                  dense
                  unelevated
                  size="sm"
                  color="primary"
                  text-color="black"
                  icon="add"
                >
                  <q-tooltip>Zur Party-Queue hinzufügen</q-tooltip>
                </q-btn>
              </template>
            </q-item-section>
          </q-item>
        </q-list>

        <!-- No results found for query -->
        <div v-else-if="searchQuery && searchQuery.trim() && !isSearching" class="column items-center q-py-lg text-center text-grey-5">
          <q-icon name="search_off" size="48px" class="q-mb-xs" />
          <div class="text-subtitle2">Keine Songs gefunden</div>
          <div class="text-caption">Probiere einen anderen Suchbegriff oder prüfe die Schreibweise.</div>
        </div>

        <!-- Empty state (no query entered yet) -->
        <div v-else class="column items-center q-py-lg text-center text-grey-5">
          <q-icon name="library_music" size="48px" class="q-mb-xs text-grey-7" />
          <div class="text-subtitle2 text-grey-4">Finde deine Lieblingssongs</div>
          <div class="text-caption text-grey-6">Klicke einen Song an, um ihn direkt in die Party-Queue einzureihen!</div>
        </div>

      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useAuth } from '@/composables/useAuth'
import { useRoom } from '@/composables/useRoom'

const props = defineProps({
  roomCode: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['track-added'])

const $q = useQuasar()
const { token, API_BASE_URL } = useAuth()
const { currentRoom, addToQueue } = useRoom()

const searchQuery = ref('')
const tracks = ref([])
const isSearching = ref(false)
const errorMessage = ref('')
let debounceTimer = null

const queueItems = computed(() => currentRoom.value?.queue || [])

function isInQueue(trackId) {
  return queueItems.value.some(item => item.track_id === trackId)
}

function getQueueVotes(trackId) {
  const item = queueItems.value.find(i => i.track_id === trackId)
  return item ? item.votes : 0
}

function onInputChanged(val) {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  if (!val || !val.trim()) {
    tracks.value = []
    errorMessage.value = ''
    return
  }

  debounceTimer = setTimeout(() => {
    executeSearch(val)
  }, 350)
}

function triggerSearchNow() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  executeSearch(searchQuery.value)
}

async function executeSearch(query) {
  const trimmed = (query || '').trim()
  if (!trimmed) {
    tracks.value = []
    return
  }

  isSearching.value = true
  errorMessage.value = ''

  try {
    const params = new URLSearchParams({
      q: trimmed,
      limit: '10'
    })
    if (props.roomCode) {
      params.append('room_code', props.roomCode)
    }

    const res = await fetch(`${API_BASE_URL}/api/spotify/search?${params.toString()}`, {
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {}
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Fehler bei der Suche.')
    }

    const data = await res.json()
    tracks.value = data.tracks || []
  } catch (err) {
    console.error('Spotify search failed:', err)
    errorMessage.value = err.message || 'Spotify Suche fehlgeschlagen.'
  } finally {
    isSearching.value = false
  }
}

async function handleTrackClick(track) {
  if (!props.roomCode) {
    if (typeof $q.notify === 'function') {
      $q.notify({
        type: 'warning',
        message: 'Kein aktiver Raum vorhanden.',
        timeout: 1500
      })
    }
    return
  }

  try {
    const updatedRoom = await addToQueue(props.roomCode, track)
    emit('track-added', track)

    if (typeof $q.notify === 'function') {
      const wasInQueue = isInQueue(track.id)
      $q.notify({
        type: 'positive',
        message: wasInQueue 
          ? `Vote für "${track.name}" hinzugefügt!` 
          : `"${track.name}" zur Party-Queue hinzugefügt!`,
        timeout: 1500
      })
    }
  } catch (err) {
    if (typeof $q.notify === 'function') {
      $q.notify({
        type: 'negative',
        message: err.message || 'Konnte Song nicht hinzufügen.',
        timeout: 2000
      })
    }
  }
}

function formatDuration(ms) {
  if (!ms) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}
</script>

<style scoped>
.track-item {
  transition: background-color 0.15s ease;
  border-radius: 8px;
}
.track-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
}
</style>
