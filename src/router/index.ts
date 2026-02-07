import { createRouter, createWebHistory } from 'vue-router'
import TopPage from '../pages/TopPage.vue'
import PlayPage from '../pages/PlayPage.vue'
import ReplayPage from '../pages/ReplayPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'top', component: TopPage },
    { path: '/play', name: 'play', component: PlayPage },
    { path: '/replay', name: 'replay', component: ReplayPage },
  ],
})

export default router
