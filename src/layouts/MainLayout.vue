<template>
  <q-layout view="lHh Lpr lFf">
    <q-header 
      class="bg-white text-grey-10"
      bordered
      >
      <q-toolbar class="constrain">
        <q-btn
          class="large-screen-only q-mr-sm"
          to="/camera"
          icon="eva-camera-outline"
          size="18px"
          flat
          dense
          round
        />

        <q-separator 
          class="large-screen-only"
          vertical
          spaced
           />
        
          <q-toolbar-title class="text-grand-hotel text-bold">
            QuasaGram
          </q-toolbar-title>

        <q-btn
          class="large-screen-only"
          to="/"
          icon="eva-home-outline"
          size="18px"
          flat
          dense
          round
        />
      </q-toolbar>
    </q-header>

    <q-footer
      class="bg-white"
      bordered
      >
      <transition
        appear
        enter-active-class="animated fadeInDown"
        leave-active-class="animated fadeOut"
      >
        <div 
          v-if="showAppInstallBanner"
          class="banner-container bg-primary"
          >
          <div class="constrain">
            <q-banner
            class="bg-primary text-white"
            inline-actions
          dense
          >
          
        <template v-slot:avatar>
            <q-avatar
              color="white"
              icon="eva-camera-outline"
              text-color="grey-10"
              font-size="22px"
            />
          </template>
          <strong>Install QuasaGram?</strong>

          <template v-slot:action>
            <q-btn
              @click="installApp"
              label="Yes"
              class="q-px-sm"
              dense
              flat
            />
            <q-btn
              @click="showAppInstallBanner = false"
              label="Later"
              class="q-px-sm"
              dense
              flat
            />
            <q-btn
              @click="neverShowAppInstallBanner"
              label="Never"
              class="q-px-sm"
              dense
              flat
            />        
          </template>
            </q-banner>
          </div>
        </div>
      </transition>
     <q-tabs
          class="text-grey-10  small-screen-only"
          active-color="primary"
          indicator-color="transparent"
        >
          <q-route-tab
            to="/"
            icon="eva-home-outline"
          />
          <q-route-tab
            to="/camera"
            icon="eva-camera-outline"
          />
        </q-tabs>
    </q-footer>

    <q-page-container class="bg-grey-1">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
  let deferredPrompt;  

  export default {
  name: 'MainLayout',
  data () {
    return {
      showAppInstallBanner: false,
    }
  },
  methods: {
    installApp() {
      this.showAppInstallBanner = false
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome == 'accepted') {
          console.log('User accepted the install prompt')
          this.neverShowAppInstallBanner()
        } else {
          console.log('User dismissed the install prompt')
        }
      });
    },
    neverShowAppInstallBanner() {
      this.showAppInstallBanner = false
      this.$q.localStorage.set('neverShowAppInstallBanner', true)
    }
  }, 
  mounted() {
    let neverShowAppInstallBanner = this.$q.localStorage.getItem('neverShowAppInstallBanner')

      if(!neverShowAppInstallBanner) {
        window.addEventListener('beforeinstallprompt', (e) => {
         // Prevent the mini-infobar from appearing on mobile
         e.preventDefault();
         // Stash the event so it can be triggered later.
         deferredPrompt = e;
   
         // Optionally, send analytics event that PWA install promo was shown.
         setTimeout(() => {
           this.showAppInstallBanner = true;
         }, 1000);
       });
      }
  }
}
</script>

<style lang="sass">
  .q-toolbar
    @media (min-width: $breakpoint-sm-min)
      height: 77px

  .q-toolbar__title
    font-size: 30px
    @media (max-width: $breakpoint-xs-max)
      text-align: center
  
  .q-footer
    .q-tab__icon
      font-size: 30px
</style>
