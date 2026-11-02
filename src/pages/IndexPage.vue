<template>
  <q-page class="q-pa-md flex flex-center bg-dark text-white">
    <div style="max-width: 840px; width: 100%;">

      <!-- Backend Connection Alert if backend is offline -->
      <q-banner v-if="authError" rounded class="bg-red-9 text-white q-mb-lg shadow-4">
        <template #avatar>
          <q-icon name="cloud_off" size="32px" />
        </template>
        <div class="text-weight-bold">Backend-Verbindung fehlgeschlagen</div>
        <div class="text-caption">{{ authError }}</div>
        <template #action>
          <q-btn flat color="white" label="Erneut versuchen" @click="checkAuth" />
        </template>
      </q-banner>

      <!-- Configuration Warning if backend is running but SPOTIFY_CLIENT_ID / SECRET are not configured -->
      <q-banner v-else-if="!isConfigured" rounded class="bg-amber-10 text-black q-mb-lg shadow-4">
        <template #avatar>
          <q-icon name="warning" size="32px" color="dark" />
        </template>
        <div class="text-weight-bold text-subtitle1">Spotify App Credentials fehlen noch!</div>
        <div class="text-body2 q-mt-xs">
          Trage deine Spotify-App-Zugangsdaten in der Datei <code>backend/.env</code> ein:
          <ul class="q-my-xs q-pl-md text-caption">
            <li><b>SPOTIFY_CLIENT_ID</b>: Client ID aus deinem Spotify Dashboard</li>
            <li><b>SPOTIFY_CLIENT_SECRET</b>: Client Secret aus deinem Spotify Dashboard</li>
            <li><b>Redirect URI im Spotify Dashboard</b>: <code>http://127.0.0.1:3000/auth/callback</code></li>
          </ul>
        </div>
        <template #action>
          <q-btn flat color="dark" label="Status aktualisieren" class="text-weight-bold" @click="checkAuth" />
        </template>
      </q-banner>

      <!-- Active Room Quick Resume Banner if user was already in a room -->
      <q-banner v-if="lastRoomCode" rounded class="bg-grey-9 text-white q-mb-lg shadow-4" style="border: 1px solid rgba(29, 185, 84, 0.4);">
        <template #avatar>
          <q-icon name="meeting_room" color="primary" size="28px" />
        </template>
        <div class="text-weight-bold">Zuletzt besuchter Raum: <span class="text-primary">{{ lastRoomCode }}</span></div>
        <div class="text-caption text-grey-4">Möchtest du wieder in deinen aktiven Party-Raum zurückkehren?</div>
        <template #action>
          <q-btn flat color="primary" label="Zum Raum" :to="`/room/${lastRoomCode}`" />
        </template>
      </q-banner>

      <!-- LOGGED IN VIEW -->
      <div v-if="isAuthenticated && user" class="column q-gutter-lg">
        <!-- User Card -->
        <q-card class="bg-grey-10 text-white shadow-10" style="border-radius: 18px; border: 1px solid rgba(255, 255, 255, 0.08);">
          <q-card-section class="row items-center q-pa-lg">
            <q-avatar size="84px" class="shadow-4 q-mr-lg">
              <img v-if="user.images && user.images.length" :src="user.images[0].url" :alt="user.display_name" />
              <q-icon v-else name="account_circle" size="84px" color="primary" />
            </q-avatar>

            <div class="col">
              <div class="row items-center q-gutter-sm">
                <span class="text-h5 text-weight-bolder">{{ user.display_name || 'Spotify Nutzer' }}</span>
                <q-badge
                  :color="user.product === 'premium' ? 'primary' : 'grey-7'"
                  :text-color="user.product === 'premium' ? 'black' : 'white'"
                  class="text-bold text-uppercase"
                  :label="user.product ? `Spotify ${user.product}` : 'Spotify'"
                />
              </div>

              <div class="text-body2 text-grey-4 q-mt-xs">
                <q-icon name="mail" class="q-mr-xs" /> {{ user.email || 'Keine E-Mail angegeben' }}
                <span v-if="user.country" class="q-ml-md">
                  <q-icon name="public" class="q-mr-xs" /> {{ user.country }}
                </span>
              </div>

              <div class="text-caption text-grey-6 q-mt-xs">
                ID: <code>{{ user.id }}</code>
              </div>
            </div>

            <div class="column q-gutter-xs">
              <q-btn
                outline
                color="negative"
                icon="logout"
                label="Abmelden"
                no-caps
                @click="logout"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Party Player Dashboard Card -->
        <q-card class="bg-grey-10 text-white shadow-8" style="border-radius: 18px; border: 1px solid rgba(255, 255, 255, 0.08);">
          <q-card-section class="q-pa-lg">
            <div class="row items-center justify-between q-mb-md">
              <div class="text-h6 text-weight-bold">
                <q-icon name="celebration" color="primary" class="q-mr-sm" />
                Deine Party-Zentrale
              </div>
              <q-badge color="positive" label="Verbunden" />
            </div>

            <p class="text-grey-4">
              Erstelle einen neuen Party-Raum mit generiertem QR-Code für deine Gäste oder tritt einem bestehenden Raum bei.
            </p>

            <div class="row q-gutter-md q-mt-md">
              <q-btn
                color="primary"
                text-color="black"
                icon="add_circle"
                label="Party-Raum erstellen"
                class="text-weight-bold shadow-4"
                no-caps
                @click="showCreateDialog = true"
              />
              <q-btn
                outline
                color="white"
                icon="meeting_room"
                label="Raum beitreten"
                no-caps
                @click="showJoinDialog = true"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- NOT LOGGED IN / HERO VIEW -->
      <div v-else class="column items-center text-center q-gutter-lg q-py-xl">
        <div class="column items-center">
          <q-avatar size="96px" class="bg-primary text-black shadow-10 q-mb-md">
            <!-- Spotify-like wave / party icon -->
            <svg viewBox="0 0 24 24" width="56" height="56" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.435-5.308-1.76-8.792-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.496 9.72 1.115.295.18.388.563.208.855zm1.226-2.726c-.226.367-.708.482-1.075.257-2.69-1.654-6.79-2.134-9.97-1.168-.413.125-.85-.11-1.075-.523-.125-.413.11-.85.523-1.075 3.633-1.103 8.15-.57 11.24 1.332.367.226.482.708.257 1.077zm.105-2.836C14.692 8.95 9.375 8.775 6.297 9.71c-.496.15-1.022-.132-1.173-.628-.15-.496.132-1.022.628-1.173 3.532-1.072 9.404-.866 13.115 1.338.445.264.59.838.327 1.282-.264.444-.838.59-1.28.33z"/>
            </svg>
          </q-avatar>

          <h1 class="text-h3 text-weight-bolder q-my-none">Spotify Party Player</h1>
          <p class="text-subtitle1 text-grey-4 q-mt-sm" style="max-width: 540px;">
            Höre Musik gemeinsam mit deinen Freunden. Jeder Gast kann Songs wünschen, in die Queue einreihen und für die besten Tracks voten.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="column items-center q-gutter-md">
          <q-btn
            size="lg"
            unelevated
            rounded
            color="primary"
            text-color="black"
            class="text-weight-bolder q-px-xl q-py-sm shadow-6 hover-scale"
            label="Mit Spotify anmelden"
            :loading="isLoading"
            no-caps
            @click="login"
          >
            <template #prepend>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" class="q-mr-xs">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.435-5.308-1.76-8.792-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.496 9.72 1.115.295.18.388.563.208.855zm1.226-2.726c-.226.367-.708.482-1.075.257-2.69-1.654-6.79-2.134-9.97-1.168-.413.125-.85-.11-1.075-.523-.125-.413.11-.85.523-1.075 3.633-1.103 8.15-.57 11.24 1.332.367.226.482.708.257 1.077zm.105-2.836C14.692 8.95 9.375 8.775 6.297 9.71c-.496.15-1.022-.132-1.173-.628-.15-.496.132-1.022.628-1.173 3.532-1.072 9.404-.866 13.115 1.338.445.264.59.838.327 1.282-.264.444-.838.59-1.28.33z"/>
              </svg>
            </template>
          </q-btn>

          <!-- Guest join option without Spotify account -->
          <q-btn
            outline
            rounded
            color="white"
            icon="meeting_room"
            label="Als Gast einem Raum beitreten"
            class="text-weight-bold q-px-lg"
            no-caps
            @click="showJoinDialog = true"
          />

          <div class="text-caption text-grey-5">
            Host benötigt Spotify Premium • Gäste können ohne Spotify-Konto beitreten!
          </div>
        </div>

        <!-- Features Grid -->
        <div class="row q-col-gutter-md q-mt-md full-width">
          <div class="col-12 col-md-4">
            <q-card class="bg-grey-10 text-white q-pa-md text-left shadow-2" style="border-radius: 12px; height: 100%;">
              <q-icon name="qr_code_scanner" size="32px" color="primary" class="q-mb-sm" />
              <div class="text-subtitle1 text-weight-bold">QR-Code Einladung</div>
              <div class="text-caption text-grey-4 q-mt-xs">
                Sofortiger Beitritt per Smartphone-Kamera direkt vor Ort auf der Party.
              </div>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card class="bg-grey-10 text-white q-pa-md text-left shadow-2" style="border-radius: 12px; height: 100%;">
              <q-icon name="queue_music" size="32px" color="primary" class="q-mb-sm" />
              <div class="text-subtitle1 text-weight-bold">Gemeinsame Queue</div>
              <div class="text-caption text-grey-4 q-mt-xs">
                Alle Gäste können Lieder suchen und zur Playlist hinzufügen.
              </div>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card class="bg-grey-10 text-white q-pa-md text-left shadow-2" style="border-radius: 12px; height: 100%;">
              <q-icon name="thumb_up" size="32px" color="primary" class="q-mb-sm" />
              <div class="text-subtitle1 text-weight-bold">Song-Voting</div>
              <div class="text-caption text-grey-4 q-mt-xs">
                Tracks mit den meisten Stimmen spielen automatisch als Nächstes.
              </div>
            </q-card>
          </div>
        </div>

      </div>

    </div>

    <!-- DIALOG: PARTY RAUM ERSTELLEN -->
    <q-dialog v-model="showCreateDialog">
      <q-card class="bg-grey-10 text-white q-pa-lg shadow-20" style="min-width: 360px; max-width: 440px; border-radius: 16px;">
        <div class="text-h6 text-weight-bold row items-center">
          <q-icon name="add_circle" color="primary" class="q-mr-sm" />
          Party-Raum erstellen
        </div>
        <div class="text-body2 text-grey-4 q-mt-xs">
          Vergib einen Namen für deinen Raum. Danach erhältst du einen QR-Code für deine Gäste!
        </div>

        <q-input
          v-model="newRoomName"
          label="Name der Party (z. B. Mikas WG Party)"
          dark
          color="primary"
          outlined
          class="q-mt-md"
          autofocus
          @keyup.enter="handleCreateRoom"
        />

        <div class="row justify-end q-gutter-sm q-mt-lg">
          <q-btn flat label="Abbrechen" color="grey-4" v-close-popup no-caps />
          <q-btn
            unelevated
            color="primary"
            text-color="dark"
            label="Raum erstellen & QR-Code generieren"
            class="text-weight-bold"
            no-caps
            :loading="isLoadingRoom"
            @click="handleCreateRoom"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- DIALOG: RAUM BEITRETEN -->
    <q-dialog v-model="showJoinDialog">
      <q-card class="bg-grey-10 text-white q-pa-lg shadow-20" style="min-width: 360px; max-width: 440px; border-radius: 16px;">
        <div class="text-h6 text-weight-bold row items-center">
          <q-icon name="meeting_room" color="primary" class="q-mr-sm" />
          Party-Raum beitreten
        </div>
        <div class="text-body2 text-grey-4 q-mt-xs">
          Gib den 6-stelligen Raum-Code ein, den dir der Host gegeben hat.
        </div>

        <q-input
          v-model="joinRoomCode"
          label="Raum-Code (z. B. BEAT42)"
          dark
          color="primary"
          outlined
          class="q-mt-md text-uppercase"
          maxlength="8"
          autofocus
          @keyup.enter="handleJoinRoom"
        />

        <q-input
          v-if="!user"
          v-model="joinNickname"
          label="Dein Name / Spitzname"
          dark
          color="primary"
          outlined
          class="q-mt-sm"
          @keyup.enter="handleJoinRoom"
        />

        <div class="row justify-end q-gutter-sm q-mt-lg">
          <q-btn flat label="Abbrechen" color="grey-4" v-close-popup no-caps />
          <q-btn
            unelevated
            color="primary"
            text-color="dark"
            label="Beitreten"
            class="text-weight-bold"
            no-caps
            :loading="isLoadingRoom"
            @click="handleJoinRoom"
          />
        </div>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuth } from '@/composables/useAuth'
import { useRoom } from '@/composables/useRoom'

const router = useRouter()
const $q = useQuasar()

const {
  user,
  isAuthenticated,
  isConfigured,
  isLoading,
  authError,
  login,
  logout,
  checkAuth
} = useAuth()

const { createRoom, joinRoom, isLoadingRoom } = useRoom()

const showCreateDialog = ref(false)
const showJoinDialog = ref(false)
const newRoomName = ref('')
const joinRoomCode = ref('')
const joinNickname = ref('')
const lastRoomCode = ref('')

async function handleCreateRoom() {
  try {
    const room = await createRoom(newRoomName.value)
    showCreateDialog.value = false
    if (typeof $q.notify === 'function') {
      $q.notify({
        type: 'positive',
        message: `Raum "${room.name}" erfolgreich erstellt!`,
        timeout: 1500
      })
    }
    await router.push(`/room/${room.code}`).catch(() => {
      window.location.hash = `/room/${room.code}`
    })
  } catch (err) {
    console.error('Error creating room:', err)
    if (typeof $q.notify === 'function') {
      $q.notify({
        type: 'negative',
        message: err.message || 'Fehler beim Erstellen des Raums',
        timeout: 2500
      })
    }
  }
}

async function handleJoinRoom() {
  const code = joinRoomCode.value.trim().toUpperCase()
  if (!code) {
    if (typeof $q.notify === 'function') {
      $q.notify({
        type: 'warning',
        message: 'Bitte gib einen Raum-Code ein.',
        timeout: 1500
      })
    }
    return
  }

  try {
    const room = await joinRoom(code, joinNickname.value)
    showJoinDialog.value = false
    if (typeof $q.notify === 'function') {
      $q.notify({
        type: 'positive',
        message: `Raum "${room.name}" beigetreten!`,
        timeout: 1500
      })
    }
    await router.push(`/room/${room.code}`).catch(() => {
      window.location.hash = `/room/${room.code}`
    })
  } catch (err) {
    console.error('Error joining room:', err)
    if (typeof $q.notify === 'function') {
      $q.notify({
        type: 'negative',
        message: err.message || 'Raum konnte nicht gefunden werden.',
        timeout: 2500
      })
    }
  }
}

onMounted(() => {
  checkAuth()
  lastRoomCode.value = localStorage.getItem('party_last_room') || ''
})
</script>

<style scoped>
.hover-scale {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.hover-scale:hover {
  transform: scale(1.04);
}
</style>
