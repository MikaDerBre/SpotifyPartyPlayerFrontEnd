<template>
  <q-page class="q-pa-xs q-pa-sm-md bg-dark text-white">
    <div style="max-width: 1040px; margin: 0 auto; width: 100%;">

      <!-- Loading State -->
      <div v-if="isLoadingRoom && !currentRoom" class="column items-center q-py-xl q-gutter-md">
        <q-spinner-tail color="primary" size="56px" />
        <div class="text-subtitle1 text-grey-4">Raum wird geladen...</div>
      </div>

      <!-- Room Error / Not Found -->
      <div v-else-if="roomError && !currentRoom" class="column items-center text-center q-py-xl q-gutter-md">
        <q-avatar size="64px" color="negative" text-color="white" icon="error_outline" />
        <div class="text-h6 text-weight-bold">Raum nicht gefunden</div>
        <div class="text-body2 text-grey-4">{{ roomError }}</div>
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
      <div v-else-if="currentRoom" class="row q-col-gutter-lg">

        <!-- Top Header Card (col-12, perfectly aligned with the grid below) -->
        <div class="col-12">
          <q-card class="bg-grey-10 text-white shadow-8" style="border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08);">
            <q-card-section class="q-pa-md q-pa-md-lg">
              <div class="row items-center justify-between q-col-gutter-sm">
                <!-- Left info: Icon, Name, Host -->
                <div class="row items-center no-wrap q-gutter-md ellipsis col-12 col-sm-auto" style="min-width: 0;">
                  <q-avatar size="50px" class="bg-primary text-black flex-shrink-0">
                    <q-icon name="celebration" size="28px" />
                  </q-avatar>
                  <div class="ellipsis" style="min-width: 0;">
                    <div class="row items-center q-gutter-sm no-wrap ellipsis">
                      <span class="text-h5 text-weight-bolder ellipsis">{{ currentRoom.name }}</span>
                      <q-badge color="positive" class="text-bold" label="LIVE" style="font-size: 11px;" />
                      <q-badge
                        v-if="isHost"
                        color="amber-9"
                        text-color="black"
                        class="text-bold"
                        label="HOST"
                        style="font-size: 11px;"
                      />
                    </div>
                    <div class="text-body2 text-grey-4 ellipsis q-mt-xs">
                      Host: <b class="text-white">{{ currentRoom.host_name }}</b>
                      <span class="q-mx-sm">•</span>
                      <span><q-icon name="group" size="16px" class="q-mr-xs" />{{ currentRoom.member_count }} Gäste</span>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="row items-center q-gutter-sm col-12 col-sm-auto justify-end q-mt-xs q-mt-sm-none flex-shrink-0">
                  <q-btn
                    v-if="isHost"
                    unelevated
                    rounded
                    color="primary"
                    text-color="black"
                    icon="qr_code_2"
                    label="Beamer-QR"
                    class="text-weight-bold q-px-md"
                    no-caps
                    @click="showFullscreenQR = true"
                  >
                    <q-tooltip>QR-Code im Großformat anzeigen</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="isHost"
                    outline
                    rounded
                    color="negative"
                    icon="close"
                    label="Raum beenden"
                    class="text-weight-bold q-px-md"
                    no-caps
                    @click="handleCloseRoom"
                  >
                    <q-tooltip>Raum schließen</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-else
                    outline
                    rounded
                    color="grey-4"
                    icon="logout"
                    label="Raum verlassen"
                    class="text-weight-bold q-px-md"
                    no-caps
                    @click="handleLeaveRoom"
                  >
                    <q-tooltip>Raum verlassen</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Left Column: Party Queue & Song Search -->
        <div class="col-12 col-md-7">
          <div class="q-gutter-y-lg">
            <!-- Live Party Queue with Voting & Currently Playing -->
            <PartyQueue :room-code="currentRoom.code" />

            <!-- Song Search -->
            <SongSearch :room-code="currentRoom.code" />
          </div>
        </div>

        <!-- Right Column: QR Code & Guest List -->
        <div class="col-12 col-md-5">
          <div class="q-gutter-y-lg">

            <!-- QR Code & Share Card -->
            <q-card class="bg-grey-10 text-white shadow-8 text-center q-pa-md q-pa-md-lg" style="border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08);">
              <div class="text-subtitle1 text-weight-bold q-mb-xs">
                <q-icon name="qr_code" color="primary" class="q-mr-xs" size="20px" />
                Mit Freunden teilen
              </div>
              <div class="text-caption text-grey-4 q-mb-md">
                Gäste können diesen QR-Code scannen, um der Party beizutreten.
              </div>

              <!-- QR Code Display -->
              <div class="flex flex-center q-my-sm">
                <div class="bg-white q-pa-sm shadow-6" style="border-radius: 12px; display: inline-block;">
                  <img
                    v-if="qrCodeUrl"
                    :src="qrCodeUrl"
                    alt="Party Room QR Code"
                    style="width: 200px; height: 200px; display: block;"
                  />
                  <q-spinner-dots v-else color="primary" size="40px" />
                </div>
              </div>

              <!-- Room Code Box -->
              <div class="q-mt-md q-pa-sm bg-grey-9 text-center" style="border-radius: 12px; border: 1px dashed rgba(255, 255, 255, 0.2);">
                <div class="text-caption text-grey-4">Code zum Beitreten:</div>
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

            <!-- Member List Card -->
            <q-card class="bg-grey-10 text-white shadow-8" style="border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08);">
              <q-card-section class="q-pa-md q-pa-md-lg">
                <div class="row items-center justify-between q-mb-md">
                  <div class="text-subtitle1 text-weight-bold">
                    <q-icon name="people" color="primary" class="q-mr-xs" size="20px" />
                    Party-Gäste ({{ currentRoom.member_count }})
                  </div>
                  <q-btn flat round dense icon="refresh" color="grey-4" @click="refreshRoom">
                    <q-tooltip>Aktualisieren</q-tooltip>
                  </q-btn>
                </div>

                <q-list separator class="bg-grey-9" style="border-radius: 12px; max-height: 280px; overflow-y: auto;">
                  <q-item v-for="member in currentRoom.members" :key="member.id" class="q-py-sm q-px-md">
                    <q-item-section avatar style="min-width: 44px;">
                      <q-avatar size="36px" class="bg-grey-8 shadow-2">
                        <img v-if="member.avatar_url" :src="member.avatar_url" :alt="member.name" />
                        <q-icon v-else name="person" size="20px" color="grey-4" />
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label class="text-weight-bold text-body2 row items-center no-wrap">
                        <span class="ellipsis">{{ member.name }}</span>
                        <q-badge
                          v-if="member.is_host"
                          color="amber-9"
                          text-color="black"
                          label="Host"
                          class="q-ml-sm text-bold"
                          style="font-size: 10px; padding: 1px 5px;"
                        />
                        <q-badge
                          v-else-if="member.id === (user?.id || guestId)"
                          color="grey-7"
                          label="Du"
                          class="q-ml-sm"
                          style="font-size: 10px; padding: 1px 5px;"
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
                        size="18px"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>

          </div>

        </div>

      </div>

    </div>

    <!-- FULLSCREEN / PARTY BEAMER QR CODE MODAL -->
    <q-dialog v-model="showFullscreenQR">
      <q-card class="bg-grey-10 text-white text-center q-pa-md q-pa-sm-xl shadow-24" style="width: 95vw; max-width: 480px; border-radius: 20px; border: 2px solid #1db954;">
        <div class="row justify-end">
          <q-btn flat round dense icon="close" color="white" v-close-popup />
        </div>

        <q-avatar :size="$q.screen.lt.sm ? '48px' : '64px'" class="bg-primary text-black q-mb-sm">
          <q-icon name="music_note" :size="$q.screen.lt.sm ? '28px' : '36px'" />
        </q-avatar>

        <div class="text-h5 text-sm-h4 text-weight-bolder">{{ currentRoom?.name }}</div>
        <div class="text-caption text-sm-subtitle1 text-grey-4 q-mt-xs">Scanne den QR-Code, um der Party beizutreten:</div>

        <div class="flex flex-center q-my-md">
          <div class="bg-white q-pa-sm shadow-10" style="border-radius: 16px;">
            <img
              v-if="qrCodeUrl"
              :src="qrCodeUrl"
              alt="Party QR Code"
              style="max-width: 240px; width: 100%; height: auto; display: block;"
            />
          </div>
        </div>

        <div class="q-pa-sm bg-grey-9 text-center" style="border-radius: 12px;">
          <div class="text-caption text-grey-4">Raum-Code:</div>
          <div class="text-h4 text-sm-h3 text-weight-bolder text-primary tracking-widest q-my-xs">{{ currentRoom?.code }}</div>
        </div>

        <div class="text-caption text-grey-5 q-mt-md ellipsis">
          {{ joinUrl }}
        </div>
      </q-card>
    </q-dialog>

    <!-- JOIN PROMPT DIALOG FOR NEW VISITORS -->
    <q-dialog v-model="showJoinDialog" persistent>
      <q-card class="bg-grey-10 text-white q-pa-md q-pa-sm-lg shadow-16" style="width: 92vw; max-width: 420px; border-radius: 16px;">
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

  // Poll room updates every 2.5 seconds for real-time player and queue sync
  pollInterval = setInterval(async () => {
    if (currentRoom.value && !showJoinDialog.value) {
      await fetchRoom(route.params.code)
    }
  }, 2500)
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
