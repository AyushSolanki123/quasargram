<template>
    <q-page class="constrain q-pa-md">
        <transition
            appear
            enter-active-class="animated fadeInDown"
            leave-active-class="animated fadeOut" >
            <div 
            v-if="showNotificationsBanner && pushNotificationsSupported"
            class="banner-container bg-primary"
            >
                <div class="constrain">
                    <q-banner
                    class="bg-grey-3 q-mb-md"
                    dense>
                
                        <template v-slot:avatar>
                            <q-icon name="eva-bell-outline" color="primary" />
                        </template>
                        Would you like to Enable Notifications?

                        <template v-slot:action>
                            <q-btn
                            @click="enableNotifications"
                            color="primary"
                            label="Yes"
                            class="q-px-sm"
                            dense
                            flat
                            />
                            <q-btn
                            @click="showNotificationsBanner = false"
                            color="primary"
                            label="Later"
                            class="q-px-sm"
                            dense
                            flat
                            />
                            <q-btn
                            @click="neverShowNotificationsBanner"
                            color="primary"
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
        <div class="row q-col-gutter-lg">
            <div class="col-12 col-sm-8">
                <template v-if="!loadingPosts && posts.length">
                    <q-card
                    class="card-post q-mb-md"
                    v-for="post in posts"
                    :key="post.id"
                    bordered
                    flat
                    >
                        <q-item>
                            <q-item-section avatar>
                                <q-avatar>
                                    <img src="https://cdn.quasar.dev/img/boy-avatar.png" alt="avatar">
                                </q-avatar>
                            </q-item-section>

                            <q-item-section>
                                <q-item-label class="text-bold">anonymous__guy</q-item-label>
                            <q-item-label caption>
                                {{ post.location }}
                            </q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-separator />

                        <q-img
                            :src="post.imageUrl"
                            />

                        <q-card-section>
                            <div>{{ post.caption }}</div>
                            <div class="text-caption text-grey">{{ post.date | niceDate }}</div>
                        </q-card-section>

                        <q-card-actions class="q-gutter-x-md" align="right">
                            <q-btn 
                                flat
                                dense
                                icon="eva-paper-plane-outline"
                                color="black"
                                label="Share"
                            />
                            <q-btn 
                                flat
                                dense
                                icon="eva-download-outline"
                                color="black"
                                label="Download"
                                @click="downloadImage(post.imageUrl)"
                            />
                        </q-card-actions>

                    </q-card>
                </template>
                <template v-else-if="!loadingPosts && !posts.length">
                    <h5 class="text-center text-grey">No Posts Yet</h5>
                </template>

                <template v-else>
                    <div class="q-pa-md">
                        <q-card flat bordered >
                        <q-item>
                            <q-item-section avatar>
                                <q-skeleton type="QAvatar" animation="fade" size="40px" />
                            </q-item-section>

                            <q-item-section>
                            <q-item-label>
                                <q-skeleton type="text" animation="fade" />
                            </q-item-label>
                            <q-item-label caption>
                                <q-skeleton type="text" animation="fade" />
                            </q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-skeleton height="200px" square animation="fade" />

                        <q-card-section>
                            <q-skeleton type="text" class="text-subtitle2" animation="fade" />
                            <q-skeleton type="text" width="50%" class="text-subtitle2" animation="fade" />
                        </q-card-section>
                        </q-card>
                    </div>
                </template>
            </div>
            <div class="col-4">
                <q-item class="fixed large-screen-only">
                    <q-item-section avatar>
                        <q-avatar size="48px">
                            <img src="https://cdn.quasar.dev/img/boy-avatar.png" alt="avatar">
                        </q-avatar>
                    </q-item-section>

                    <q-item-section>
                        <q-item-label class="text-bold">anonymous__guy</q-item-label>
                    <q-item-label caption>
                        Anonymous Guy
                    </q-item-label>
                    </q-item-section>
                </q-item>
            </div>
        </div>

        
    </q-page>
</template>

<script>
    import { date } from 'quasar' 
    let qs = require('qs')
   
    export default {
        name: 'PageHome',
        data() {
            return {
                posts: [],
                loadingPosts: false,
                showNotificationsBanner: false,
            }
        },
        computed: {
            serviceWorkerSupported() {
                if ('serviceWorker' in navigator) return true
                return false
            },
            pushNotificationsSupported() {
                if ('PushManager' in window) return true 
                return false
            }
        },
        methods: {
            downloadImage(url) {
                fetch(url)
                    .then((response) => response.blob())
                    .then((blob) => {
                    saveAs(blob, 'image_name.jpg');
                    });
                console.log('downloading', url);
            },
            getPosts() {
                this.loadingPosts = true
                setTimeout(() => {
                    this.$axios.get(`${ process.env.API }/posts`).then(response => {
                        this.posts = response.data
                        console.log(this.posts)
                        this.loadingPosts = false
                    }).catch(err => {
                        this.$q.dialog({
                            title: 'Error',
                            message: 'Could not download Posts'
                        })
                        this.loadingPosts = false
                    })
                }, 500);
            },
            initNotificationsBanner() {
                let neverShowNotificationsBanner = this.$q.localStorage.getItem('neverShowNotificationsBanner')

                if(!neverShowNotificationsBanner) {
                    this.showNotificationsBanner = true
                }
            },
            enableNotifications() {
                if (this.pushNotificationsSupported) {
                    Notification.requestPermission(result => {
                        console.log('result: ', result)
                        this.neverShowNotificationsBanner() 
                        if (result == 'granted') {
                            // this.displayGrantedNotification()
                            this.checkForExistingPushSubscription()
                        }
                    })
                }
            },
            checkForExistingPushSubscription() {
                if (this.serviceWorkerSupported && this.pushNotificationsSupported) {
                    let reg
                    navigator.serviceWorker.ready.then(swreg => {
                        reg = swreg
                        return swreg.pushManager.getSubscription()
                    }).then(sub => {
                        if (!sub) {
                            this.createPushSubscription(reg)
                        }
                    })
                }
            },
            createPushSubscription(reg) {
                let vapidPublicKey = "BL-pUp3zfUD304XEdbe7yonORryM3B7pj_n2mY-qBMeiH9FinS6Ny6aaRFZX1uHYVw03V_fDkRVfrr0h29JAx9E"
                reg.pushManager.subscribe({
                    applicationServerKey: vapidPublicKey,
                    userVisibleOnly: true
                }).then(newSub => {
                        let newSubData = newSub.toJSON(),
                            newSubDataQS = qs.stringify(newSubData)

                    return this.$axios.post(`${ process.env.API }/createSubscription?${ newSubDataQS }`)
                }).then(response => {
                    this.displayGrantedNotification()
                }).catch(err => {
                    console.log('error: ', err)
                })
            },
            displayGrantedNotification() {
                // new Notification("You're subscribed to notifications!", {
                //     body: "Thanks for subscribing",
                //     icon: "icons/icon-128x128.png",
                //     image: "icons/icon-128x128.png",
                //     badge: "icons/icon-128x128.png",
                //     dir: 'ltr',
                //     lang: 'en-us',
                //     vibrate: [100, 50, 200],
                //     tag: 'confirm-notification',
                //     renotify: true,
                // })
                if (this.serviceWorkerSupported && this.pushNotificationsSupported) {
                    navigator.serviceWorker.ready.then(swreg => {
                        swreg.showNotification("You're subscribed to notifications!", {
                            body: "Thanks for subscribing",
                            icon: "icons/icon-128x128.png",
                            image: "icons/icon-128x128.png",
                            badge: "icons/icon-128x128.png",
                            dir: 'ltr',
                            lang: 'en-us',
                            vibrate: [100, 50, 200],
                            tag: 'confirm-notification',
                            renotify: true,
                            actions: [
                                {
                                    action: 'hello',
                                    title: 'hello',
                                    icon: 'icons/icon-128x128.png'
                                },
                                {
                                    action: 'goodbye',
                                    title: 'goodbye',
                                    icon: 'icons/icon-128x128.png'
                                },
                            ]
                        })
                    })
                }
            },
            neverShowNotificationsBanner() {
                this.showNotificationsBanner = false
                this.$q.localStorage.set('neverShowNotificationsBanner', true)
            },
        },
        filters: {
            niceDate(value) {
                return date.formatDate(value, 'MMMM D h:mm A')
            }
        },
        created () {
            this.getPosts()
            this.initNotificationsBanner()
        }   
    }
</script>

<style lang="sass">
    .card-post
        border-radius: 16px
        .q-img
            min-height: 200px
</style>