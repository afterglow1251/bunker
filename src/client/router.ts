import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./pages/HomePage.vue') },
    { path: '/lobby/:roomCode?', component: () => import('./pages/LobbyPage.vue') },
    { path: '/game/:roomCode', component: () => import('./pages/GamePage.vue') },
    { path: '/results/:roomCode', component: () => import('./pages/ResultsPage.vue') },
  ],
})
