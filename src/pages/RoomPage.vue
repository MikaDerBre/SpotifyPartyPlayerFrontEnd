<template>
  <q-page class="q-pa-md bg-dark text-white">
    <div style="max-width: 1040px; margin: 0 auto;">

      <!-- Loading State -->
      <div v-if="isLoadingRoom && !currentRoom" class="column items-center q-py-xl q-gutter-md">
        <q-spinner-tail color="primary" size="64px" />
        <div class="text-h6 text-grey-4">Raum wird geladen...</div>
      </div>

      <!-- Room Error / Not Found -->
      <div v-else-if="roomError && !currentRoom" class="column items-center text-center q-py-xl q-gutter-md">
        <q-avatar size="72px" color="negative" text-color="white" icon="error_outline" />
        <div class="text-h5 text-weight-bold">Raum nicht gefunden</div>
        <div class="text-body1 text-grey-4">{{ roomError }}</div>
        <q-btn
          color="primary"
          text-color="dark"
          class="q-mt-md text-weight-bold"
          label="Zurück zur Startseite"
          to="/"
          no-caps
        />
      </div>

      <!-- ROOM CONTENT -->
      <div v-else-if="currentRoom" class="column q-gutter-lg">

        <!-- Top Header Card -->
        <q-card class="bg-grey-10 text-white shadow-8" style="border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08);">
          <q-card-section class="row items-center justify-between q-pa-lg">
            <div class="row items-center q-gutter-md">
              <q-avatar size="56px" class="bg-primary text-black">
                <q-icon name="celebration" size="32px" />
              </q-avatar>
              <div>
                <div class="row items-center q-gutter-sm">
                  <span class="text-h5 text-weight-bolder">{{ currentRoom.name }}</span>
                  <q-badge color="positive" class="text-bold" label="LIVE" />
                  <q-badge
                    v-if="isHost"
                    color="amber-9"
                    text-color="black"
                    class="text-bold"
                    label="HOST"
                  />
                </div>
                <div class="text-body2 text-grey-4 q-mt-xs">
                  Host: <span class="text-white text-weight-medium">{{ currentRoom.host_name }}</span>
                  <span class="q-mx-sm">•</span>
                  <span><q-icon name="group" class="q-mr-xs" /> {{ currentRoom.member_count }} Teilnehmer</span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="row items-center q-gutter-sm q-mt-sm-none q-mt-md">
              <q-btn
                v-if="isHost"
                color="primary"
                text-color="black"
                icon="qr_code_2"
                label="QR-Code Vollbild"
                class="text-weight-bold"
                no-caps
                @click="showFullscreenQR = true"
              />
              <q-btn
                v-if="isHost"
                outline
                color="negative"
                icon="close"
                label="Raum beenden"
                no-caps
                @click="handleCloseRoom"
              />
              <q-btn
                v-else
                outline
                color="grey-4"
                icon="logout"
                label="Raum verlassen"
                no-caps
                @click="handleLeaveRoom"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Main Grid: QR Code & Share Card on Left, Members & Queue on Right -->
        <div class="row q-col-gutter-lg">

          <!-- Left Column: Host QR Code & Join Info -->
          <div class="col-12 col-md-5">
            <q-card class="bg-grey-10 text-white shadow-8 text-center q-pa-lg" style="border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08);">
              <div class="text-subtitle1 text-weight-bold q-mb-xs">
                <q-icon name="qr_code" color="primary" class="q-mr-xs" />
                Mit Freunden teilen
              </div>
              <div class="text-caption text-grey-4 q-mb-md">
                Gäste können diesen QR-Code mit der Handy-Kamera scannen, um direkt beizutreten.
              </div>

              <!-- QR Code Display -->
              <div class="flex flex-center q-my-sm">
                <div class="bg-white q-pa-sm shadow-6" style="border-radius: 12px; display: inline-block;">
                  <img
                    v-if="qrCodeUrl"
                    :src="qrCodeUrl"
                    alt="Party Room QR Code"
                    style="width: 220px; height: 220px; display: block;"
                  />
                  <q-spinner-dots v-else color="primary" size="40px" />
                </div>
              </div>

              <!-- Room Code Box -->
              <div class="q-mt-md q-pa-sm bg-grey-9 text-center" style="border-radius: 10px; border: 1px dashed rgba(255, 255, 255, 0.2);">
                <div class="text-caption text-grey-4">Oder manuell Raum-Code eingeben:</div>
                <div class="row items-center justify-center q-gutter-sm q-mt-xs">
                  <span class="text-h4 text-weight-bolder text-primary tracking-widest">{{ currentRoom.code }}</span>
                  <q-btn flat round dense icon="content_copy" color="white" @click="copyRoomCode">
                    <q-tooltip>Code kopieren</q-tooltip>
                  </q-btn>
                </div>
              </div>

              <!-- Copy Share Link Button -->
              <q-btn
                outline
                color="primary"
                class="full-width q-mt-md text-weight-bold"
                icon="share"
                label="Einladungslink kopieren"
                no-caps
                @click="copyJoinLink"
              />
            </q-card>
          </div>

          <!-- Right Column: Members List & Party Queue Placeholder -->
          <div class="col-12 col-md-7 column q-gutter-lg">

            <!-- Member List Card -->
            <q-card class="bg-grey-10 text-white shadow-8" style="border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08);">
              <q-card-section>
                <div class="row items-center justify-between q-mb-sm">
                  <div class="text-subtitle1 text-weight-bold">
                    <q-icon name="people" color="primary" class="q-mr-xs" />
                    Party-Gäste ({{ currentRoom.member_count }})
                  </div>
                  <q-btn flat round dense icon="refresh" color="grey-4" @click="refreshRoom">
                    <q-tooltip>Aktualisieren</q-tooltip>
                  </q-btn>
                </div>

                <q-list separator class="bg-grey-9" style="border-radius: 10px;">
                  <q-item v-for="member in currentRoom.members" :key="member.id" class="q-py-sm">
                    <q-item-section avatar>
                      <q-avatar size="38px" class="bg-grey-8 shadow-2">
                        <img v-if="member.avatar_url" :src="member.avatar_url" :alt="member.name" />
                        <q-icon v-else name="person" color="grey-4" />
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label class="text-weight-bold row items-center">
                        <span>{{ member.name }}</span>
                        <q-badge
                          v-if="member.is_host"
                          color="amber-9"
                          text-color="black"
                          label="Host"
                          class="q-ml-sm text-bold"
                        />
                        <q-badge
                          v-else-if="member.id === (user?.id || guestId)"
                          color="grey-7"
                          label="Du"
                          class="q-ml-sm"
                        />
                      </q-item-label>
                      <q-item-label caption class="text-grey-5">
                        {{ member.is_host ? 'Host & DJ' : 'Gast' }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-icon
                        :name="member.is_host ? 'star' : 'headphones'"
                        :color="member.is_host ? 'amber' : 'primary'"
                        size="20px"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>

            <!-- Live Party Queue with Voting -->
            <PartyQueue :room-code="currentRoom.code" />

            <!-- Song Search -->
            <SongSearch :room-code="currentRoom.code" />

          </div>

        </div>

      </div>

    </div>

    <!-- FULLSCREEN / PARTY BEAMER QR CODE MODAL -->
    <q-dialog v-model="showFullscreenQR">
      <q-card class="bg-grey-10 text-white text-center q-pa-xl shadow-24" style="min-width: 360px; max-width: 520px; border-radius: 24px; border: 2px solid #1db954;">
        <div class="row justify-end">
          <q-btn flat round dense icon="close" color="white" v-close-popup />
        </div>

        <q-avatar size="64px" class="bg-primary text-black q-mb-md">
          <q-icon name="music_note" size="36px" />
        </q-avatar>

        <div class="text-h4 text-weight-bolder">{{ currentRoom?.name }}</div>
        <div class="text-subtitle1 text-grey-4 q-mt-xs">Scanne den QR-Code, um der Party beizutreten:</div>

        <div class="flex flex-center q-my-lg">
          <div class="bg-white q-pa-md shadow-10" style="border-radius: 16px;">
            <img
              v-if="qrCodeUrl"
              :src="qrCodeUrl"
              alt="Party QR Code"
              style="width: 280px; height: 280px; display: block;"
            />
          </div>
        </div>

        <div class="q-pa-sm bg-grey-9 text-center" style="border-radius: 12px;">
          <div class="text-caption text-grey-4">Raum-Code:</div>
          <div class="text-h3 text-weight-bolder text-primary tracking-widest q-my-xs">{{ currentRoom?.code }}</div>
        </div>

        <div class="text-caption text-grey-5 q-mt-md">
          {{ joinUrl }}
        </div>
      </q-card>
    </q-dialog>

    <!-- JOIN PROMPT DIALOG FOR NEW VISITORS -->
    <q-dialog v-model="showJoinDialog" persistent>
      <q-card class="bg-grey-10 text-white q-pa-lg shadow-16" style="min-width: 340px; max-width: 420px; border-radius: 16px;">
        <div class="text-h6 text-weight-bold row items-center">
          <q-icon name="celebration" color="primary" class="q-mr-sm" />
          Party beitreten
        </div>
        <div class="text-body2 text-grey-4 q-mt-xs">
          Du bist eingeladen zu: <b class="text-white">{{ currentRoom?.name }}</b>
        </div>

        <q-input
          v-model="guestNickname"
          label="Dein Name / Spitzname"
          dark
          color="primary"
          outlined
          class="q-mt-md"
          autofocus
          @keyup.enter="confirmJoin"
        />

        <div class="row justify-end q-gutter-sm q-mt-lg">
          <q-btn flat label="Abbrechen" color="grey-4" to="/" no-caps />
          <q-btn
            unelevated
            color="primary"
            text-color="dark"
            label="Jetzt beitreten"
            class="text-weight-bold"
            no-caps
            :loading="isLoadingRoom"
            @click="confirmJoin"
          />
        </div>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import QRCode from 'qrcode'
import { useRoom } from '@/composables/useRoom'
import { useAuth } from '@/composables/useAuth'
import SongSearch from '@/components/SongSearch.vue'
import PartyQueue from '@/components/PartyQueue.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const {
  currentRoom,
  isHost,
  guestId,
  isLoadingRoom,
  roomError,
  fetchRoom,
  joinRoom,
  leaveRoom,
  closeRoom
} = useRoom()

const { user } = useAuth()

const qrCodeUrl = ref('')
const showFullscreenQR = ref(false)
const showJoinDialog = ref(false)
const guestNickname = ref('')
let pollInterval = null

const joinUrl = computed(() => {
  if (!currentRoom.value) return ''
  return `${window.location.origin}/#/room/${currentRoom.value.code}`
})

async function generateQRCode() {
  if (!joinUrl.value) return
  try {
    qrCodeUrl.value = await QRCode.toDataURL(joinUrl.value, {
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
  } catch (err) {
    console.error('Failed to generate QR code:', err)
  }
}

async function copyRoomCode() {
  if (!currentRoom.value) return
  try {
    await navigator.clipboard.writeText(currentRoom.value.code)
    if (typeof $q.notify === 'function') {
      $q.notify({
        type: 'positive',
        message: `Raum-Code ${currentRoom.value.code} kopiert!`,
        timeout: 1500
      })
    }
  } catch (e) {
    console.error(e)
  }
}

async function copyJoinLink() {
  if (!joinUrl.value) return
  try {
    await navigator.clipboard.writeText(joinUrl.value)
    if (typeof $q.notify === 'function') {
      $q.notify({
        type: 'positive',
        message: 'Einladungslink in die Zwischenablage kopiert!',
        timeout: 1500
      })
    }
  } catch (e) {
    console.error(e)
  }
}

async function refreshRoom() {
  const code = route.params.code
  if (code) {
    await fetchRoom(code)
  }
}

async function confirmJoin() {
  const code = route.params.code
  if (!code) return
  try {
    await joinRoom(code, guestNickname.value)
    showJoinDialog.value = false
    await generateQRCode()
    if (typeof $q.notify === 'function') {
      $q.notify({
        type: 'positive',
        message: 'Du bist der Party beigetreten!',
        timeout: 1500
      })
    }
  } catch (e) {
    if (typeof $q.notify === 'function') {
      $q.notify({
        type: 'negative',
        message: e.message || 'Konnte nicht beitreten.',
        timeout: 2000
      })
    }
  }
}

async function handleLeaveRoom() {
  if (!currentRoom.value) return
  await leaveRoom(currentRoom.value.code)
  router.push('/')
}

async function handleCloseRoom() {
  if (!currentRoom.value) return
  await closeRoom(currentRoom.value.code)
  if (typeof $q.notify === 'function') {
    $q.notify({
      type: 'info',
      message: 'Raum wurde geschlossen.',
      timeout: 1500
    })
  }
  router.push('/')
}

onMounted(async () => {
  const code = route.params.code
  if (!code) {
    router.push('/')
    return
  }

  guestNickname.value = user.value?.display_name || ''

  try {
    const room = await fetchRoom(code)
    if (room) {
      await generateQRCode()

      // Check if current user/guest is already in members list
      const myId = user.value?.id || guestId
      const isAlreadyIn = room.members.some(m => m.id === myId)

      if (!isAlreadyIn) {
        // If not already in the room, prompt to join
        showJoinDialog.value = true
      }
    }
  } catch (e) {
    console.warn('Room fetch error:', e)
  }

  // Poll room updates every 5 seconds for real-time member updates
  pollInterval = setInterval(async () => {
    if (currentRoom.value && !showJoinDialog.value) {
      await fetchRoom(route.params.code)
    }
  }, 5000)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
  }
})
</script>

<style scoped>
.tracking-widest {
  letter-spacing: 0.15em;
}
</style>
