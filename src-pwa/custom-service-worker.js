/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.conf > pwa > workboxPluginMode is set to "InjectManifest"
 */

    /*
        dependencies
    */

    import {precacheAndRoute} from 'workbox-precaching'
    import {registerRoute} from 'workbox-routing'
    import {StaleWhileRevalidate} from 'workbox-strategies'
    import {CacheFirst} from 'workbox-strategies'
    import {ExpirationPlugin} from 'workbox-expiration'
    import {CacheableResponsePlugin} from 'workbox-cacheable-response'
    import {NetworkFirst} from 'workbox-strategies';  
  
    /*
        config
    */

    precacheAndRoute(self.__WB_MANIFEST);
    let backgroundSyncSupported = 'sync' in self.registration ? true : false
    console.log('backgroundSyncSupported: ', backgroundSyncSupported) 

    /*
        caching strategies
    */

    registerRoute(
        ({url}) => url.host.startsWith('fonts.g'),
        new CacheFirst({
        cacheName: 'google-fonts',
        plugins: [
            new ExpirationPlugin({
            maxEntries: 30,
            }),
            new CacheableResponsePlugin({
            statuses: [0, 200]
            }),
        ],
        })
    );

    registerRoute(
        ({url}) => url.pathname.startsWith('/posts'),
        new NetworkFirst()
    );

    registerRoute(
        ({url}) => url.href.startsWith('http'),
        new StaleWhileRevalidate()
    );
        
    /*
        event - push
    */

    self.addEventListener('push', event => {
        console.log('Push Message recieved: ', event)
        if (event.data) {
            let data = JSON.parse(event.data.text())
            event.waitUntil(
                self.registration.showNotifications(
                    data.title, 
                    {
                        body: data.body,
                        icon: "icons/icon-128x128.png",
                        badge: "icons/icon-128x128.png",
                        data: {
                            openUrl: data.openUrl
                        }
                    }
                )
            )
        }
    })  

    /*
        event - notifications
    */

    self.addEventListener('notificationClick', event => {
        let notification = event.notification
        let action = event.action
        setTimeout(() => {
            if (action == 'hello') {
                console.log('Hello Button was clicked')
            } else if (action == 'goodbye') {
                console.log('GoodBye button was clicked')
            } else {
                event.waitUntil(
                    clients.matchAll().then(clis => {
                        let clientUsingApp = clis.find(cli => {
                            return cli.visibiltiyState === 'visible'
                        })
                        if (clientUsingApp) {
                            clientUsingApp.navigate(notification.data.openUrl)
                            clientUsingApp.focus()
                        } else {
                            clients.openWindow(notification.data.openUrl)
                        }
                    })
                )
            }
            notification.close()
        }, 100)
    })

    self.addEventListener('notificationClose', event => {
        setTimeout(() => {
            console.log('Notification was Closed', event)
        }, 100)
    })
    