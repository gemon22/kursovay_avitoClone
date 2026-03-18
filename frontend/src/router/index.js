import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AuthView from '../views/AuthView.vue'
import ItemView from '../views/ItemView.vue'
import ProfileView from '../views/ProfileView.vue'
import MessagesView from '../views/MessagesView.vue'
import FavoritesView from '../views/FavoritesView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/auth', name: 'auth', component: AuthView },
  { path: '/item/:id', name: 'item', component: ItemView },
  { path: '/profile', name: 'profile', component: ProfileView },
  { path: '/favorites', name: 'favorites', component: FavoritesView },
  { path: '/messages', name: 'messages', component: MessagesView },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
