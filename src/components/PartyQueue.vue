<template>
  <q-card class="bg-grey-10 text-white shadow-8" style="border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08);">
    <q-card-section class="q-pa-lg">
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

      <!-- Queue is Empty -->
      <div v-if="!queue.length" class="column items-center q-py-xl text-center text-grey-5">
        <q-icon name="queue_music" size="56px" class="q-mb-sm text-grey-7" />
        <div class="text-h6 text-weight-medium text-grey-4">Die Queue ist noch leer</div>
        <div class="text-caption text-grey-6 q-mt-xs" style="max-width: 380px;">
          Suche oben nach Songs und klicke sie an, um sie zur Party-Queue hinzuzufügen. Jeder kann für seine Favoriten voten!
        </div>
      </div>

      <!-- Queue List -->
      <q-list v-else separator class="bg-grey-9" style="border-radius: 12px; overflow: hidden;">
        <transition-group name="queue-flip" tag="div">
          <q-item
            v-for="(track, index) in queue"
            :key="track.id"
            class="q-py-md queue-item"
            :class="{ 'first-place': index === 0 }"
          >
            <!-- Rank Badge -->
            <q-item-section avatar style="min-width: 44px;" class="q-pr-sm items-center">
              <template v-if="index === 0">
                <q-avatar size="32px" color="primary" text-color="black" class="text-weight-bolder shadow-3">
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
            <q-item-section avatar>
              <q-avatar rounded size="52px" class="bg-grey-8 shadow-2">
                <img v-if="track.album_art" :src="track.album_art" :alt="track.name" />
                <q-icon v-else name="album" color="grey-5" />
              </q-avatar>
            </q-item-section>

            <!-- Track Info -->
            <q-item-section>
              <div class="row items-center no-wrap">
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

              <div class="row items-center q-gutter-x-sm text-caption text-grey-5 q-mt-xs">
                <span>{{ formatDuration(track.duration_ms) }}</span>
                <span>•</span>
                <span>von <b class="text-grey-4">{{ track.added_by_name }}</b></span>
              </div>
            </q-item-section>

            <!-- Vote Button & Actions -->
            <q-item-section side class="row items-center no-wrap q-gutter-x-sm">
              <!-- Upvote Button -->
              <q-btn
                unelevated
                rounded
                :color="hasVoted(track) ? 'primary' : 'grey-8'"
                :text-color="hasVoted(track) ? 'black' : 'white'"
                class="text-weight-bolder q-px-md"
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
</style>
