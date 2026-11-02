<template>
  <q-card class="bg-grey-10 text-white shadow-8" style="border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08);">
    <q-card-section class="q-pa-md q-pa-md-lg">
      <div class="row items-center justify-between q-mb-md">
        <div class="row items-center q-gutter-sm">
          <q-avatar size="36px" class="bg-primary text-black">
            <q-icon name="format_list_numbered" size="22px" />
          </q-avatar>
          <div>
            <div class="text-h6 text-weight-bold">Party-Queue</div>
            <div class="text-caption text-grey-4">Sortiert nach den meisten Stimmen</div>
          </div>
        </div>

        <q-badge color="grey-8" class="text-bold text-subtitle2 q-px-sm q-py-xs">
          {{ queue.length }} {{ queue.length === 1 ? 'Song' : 'Songs' }}
        </q-badge>
      </div>

      <!-- Now Playing Section (Live Spotify Sync) -->
      <div v-if="currentlyPlaying" class="now-playing-banner q-mb-lg q-pa-md bg-grey-9 text-white shadow-4" style="border-radius: 14px; border: 1px solid rgba(29, 185, 84, 0.35);">
        <div class="row items-center justify-between q-mb-xs">
          <div class="row items-center q-gutter-xs text-primary text-weight-bolder text-caption tracking-wider">
            <q-icon :name="currentlyPlaying.is_playing ? 'graphic_eq' : 'pause_circle'" size="18px" />
            <span>{{ currentlyPlaying.is_playing ? 'AKTUELL LÄUFT AUF SPOTIFY' : 'SPOTIFY PAUSIERT' }}</span>
          </div>

          <q-badge
            v-if="currentlyPlaying.is_playing && remainingSeconds <= 12 && remainingSeconds > 0"
            color="orange-9"
            text-color="white"
            class="text-weight-bold pulse-badge q-px-sm q-py-xs"
          >
            <q-icon name="sync" class="rotate-sync q-mr-xs" size="14px" />
            Übergang aktiv (&le; 12s)
          </q-badge>
          <q-badge
            v-else-if="currentlyPlaying.is_playing"
            color="grey-8"
            text-color="grey-3"
            class="text-weight-medium q-px-sm q-py-xs"
          >
            Noch {{ formatDuration(currentlyPlaying.remaining_ms) }}
          </q-badge>
        </div>

        <div class="row items-center no-wrap q-mt-sm">
          <q-avatar rounded size="56px" class="bg-grey-8 shadow-3 q-mr-md flex-shrink-0">
            <img v-if="currentlyPlaying.album_art" :src="currentlyPlaying.album_art" :alt="currentlyPlaying.name" />
            <q-icon v-else name="album" color="grey-5" />
          </q-avatar>

          <div class="column justify-center ellipsis" style="flex: 1; min-width: 0;">
            <div class="text-subtitle1 text-weight-bolder ellipsis text-white">{{ currentlyPlaying.name }}</div>
            <div class="text-caption text-grey-4 ellipsis">{{ currentlyPlaying.artist_display }}</div>
            <div class="text-caption text-grey-5 ellipsis">{{ currentlyPlaying.album_name }}</div>
          </div>
        </div>

        <!-- Live Progress Bar -->
        <div class="q-mt-md">
          <q-linear-progress
            :value="progressRatio"
            color="primary"
            track-color="grey-8"
            rounded
            size="6px"
          />
          <div class="row justify-between text-caption text-grey-4 q-mt-xs">
            <span>{{ formatDuration(currentlyPlaying.progress_ms) }}</span>
            <span>-{{ formatDuration(currentlyPlaying.remaining_ms) }}</span>
          </div>
        </div>
      </div>

      <div v-else-if="isHost" class="q-mb-md q-pa-sm bg-grey-9 text-grey-4 text-caption row items-center q-gutter-x-sm" style="border-radius: 10px; border: 1px dashed rgba(255, 255, 255, 0.15);">
        <q-icon name="info" color="grey-5" size="18px" />
        <span>Host-Info: Starte die Musik auf Spotify – sobald ein Song läuft, wird der nächste #1 Song &le; 12s vor Ende automatisch in die Warteschlange gereiht.</span>
      </div>

      <!-- Queue is Empty -->
      <div v-if="!queue.length" class="column items-center q-py-xl text-center text-grey-5">
        <q-icon name="queue_music" size="56px" class="q-mb-sm text-grey-7" />
        <div class="text-h6 text-weight-medium text-grey-4">Die Queue ist noch leer</div>
        <div class="text-caption text-grey-6 q-mt-xs" style="max-width: 380px;">
          Suche unten nach Songs und klicke sie an, um sie zur Party-Queue hinzuzufügen. Jeder kann für seine Favoriten voten!
        </div>
      </div>

      <!-- Queue List -->
      <q-list v-else separator class="bg-grey-9" style="border-radius: 12px; overflow: hidden;">
        <transition-group name="queue-flip" tag="div">
          <q-item
            v-for="(track, index) in queue"
            :key="track.id"
            class="q-py-md q-px-md queue-item"
            :class="{ 'first-place': index === 0 }"
          >
            <!-- Rank Badge -->
            <q-item-section avatar style="min-width: 44px;" class="items-center q-pr-sm">
              <template v-if="index === 0">
                <q-avatar size="32px" color="primary" text-color="black" class="text-weight-bolder shadow-2">
                  #1
                </q-avatar>
              </template>
              <template v-else>
                <span class="text-weight-bold text-subtitle1 text-grey-5">
                  #{{ index + 1 }}
                </span>
              </template>
            </q-item-section>

            <!-- Album Cover -->
            <q-item-section avatar class="q-pr-sm">
              <q-avatar rounded size="52px" class="bg-grey-8 shadow-2 flex-shrink-0">
                <img v-if="track.album_art" :src="track.album_art" :alt="track.name" />
                <q-icon v-else name="album" color="grey-5" />
              </q-avatar>
            </q-item-section>

            <!-- Track Info -->
            <q-item-section style="min-width: 0; flex: 1;">
              <div class="row items-center no-wrap ellipsis">
                <span class="text-subtitle1 text-weight-bold ellipsis text-white">{{ track.name }}</span>
                <q-badge
                  v-if="index === 0"
                  color="primary"
                  text-color="black"
                  label="NEXT UP"
                  class="q-ml-sm text-bold"
                  style="font-size: 10px;"
                />
              </div>

              <div class="text-caption text-grey-4 ellipsis q-mt-xs">
                {{ track.artist_display }}
              </div>

              <div class="row items-center q-gutter-x-sm text-caption text-grey-5 ellipsis q-mt-xs">
                <span>{{ formatDuration(track.duration_ms) }}</span>
                <span>•</span>
                <span class="ellipsis">von <b class="text-grey-4">{{ track.added_by_name }}</b></span>
              </div>
            </q-item-section>

            <!-- Vote Button & Actions (Guaranteed side-by-side row) -->
            <q-item-section side class="q-pl-sm">
              <div class="row items-center no-wrap q-gutter-x-sm">
                <!-- Upvote Button -->
                <q-btn
                  unelevated
                  rounded
                  :color="hasVoted(track) ? 'primary' : 'grey-8'"
                  :text-color="hasVoted(track) ? 'black' : 'white'"
                  class="text-weight-bolder q-px-md"
                  style="height: 38px;"
                  no-caps
                  @click="handleVote(track)"
                >
                  <q-icon name="thumb_up" size="18px" class="q-mr-xs" />
                  <span style="font-size: 15px;">{{ track.votes }}</span>
                  <q-tooltip>{{ hasVoted(track) ? 'Du hast bereits gevotet' : 'Diesen Song nach oben voten' }}</q-tooltip>
                </q-btn>

                <!-- Delete button for Host -->
                <q-btn
                  v-if="isHost"
                  flat
                  round
                  dense
                  icon="delete_outline"
                  color="grey-5"
                  @click="handleRemove(track)"
                >
                  <q-tooltip>Song aus Queue entfernen</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>
        </transition-group>
      </q-list>

    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useAuth } from '@/composables/useAuth'
import { useRoom } from '@/composables/useRoom'

const props = defineProps({
  roomCode: {
    type: String,
    required: true
  }
})

const $q = useQuasar()
const { user } = useAuth()
const { currentRoom, isHost, guestId, voteTrack, removeFromQueue } = useRoom()

const queue = computed(() => currentRoom.value?.queue || [])
const currentlyPlaying = computed(() => currentRoom.value?.currently_playing)
const remainingSeconds = computed(() => {
  if (!currentlyPlaying.value?.remaining_ms) return 0
  return Math.ceil(currentlyPlaying.value.remaining_ms / 1000)
})
const progressRatio = computed(() => {
  if (!currentlyPlaying.value || !currentlyPlaying.value.duration_ms) return 0
  return Math.min(1, Math.max(0, currentlyPlaying.value.progress_ms / currentlyPlaying.value.duration_ms))
})

const currentUserId = computed(() => user.value?.id || guestId)

function hasVoted(track) {
  if (!track || !track.voters) return false
  return track.voters.includes(currentUserId.value)
}

async function handleVote(track) {
  if (hasVoted(track)) {
    if (typeof $q.notify === 'function') {
      $q.notify({
        type: 'info',
        message: 'Du hast für diesen Song bereits abgestimmt!',
        timeout: 1200
      })
    }
    return
  }

  try {
    await voteTrack(props.roomCode, track.track_id)
    if (typeof $q.notify === 'function') {
      $q.notify({
        type: 'positive',
        message: `Vote für "${track.name}" registriert!`,
        timeout: 1200
      })
    }
  } catch (err) {
    if (typeof $q.notify === 'function') {
      $q.notify({
        type: 'negative',
        message: err.message || 'Fehler beim Voten.',
        timeout: 2000
      })
    }
  }
}

async function handleRemove(track) {
  try {
    await removeFromQueue(props.roomCode, track.track_id)
    if (typeof $q.notify === 'function') {
      $q.notify({
        type: 'info',
        message: `"${track.name}" aus der Queue entfernt.`,
        timeout: 1200
      })
    }
  } catch (err) {
    console.error(err)
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
.queue-item {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}
.first-place {
  background: linear-gradient(90deg, rgba(29, 185, 84, 0.12) 0%, rgba(29, 185, 84, 0.02) 100%);
  border-left: 3px solid #1db954;
}

/* Animations for queue reordering */
.queue-flip-move {
  transition: transform 0.4s ease;
}

.pulse-badge {
  animation: pulse-glow 1.5s infinite;
}
@keyframes pulse-glow {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 124, 0, 0.7); }
  50% { transform: scale(1.04); box-shadow: 0 0 0 6px rgba(245, 124, 0, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 124, 0, 0); }
}

.rotate-sync {
  animation: spin 2s linear infinite;
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
