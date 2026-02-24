import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'
import EntryGate from './pages/EntryGate'
import Home from './pages/Home'
import Nexus from './pages/Nexus'
import ChronoMap from './pages/ChronoMap'
import ForumThread from './pages/ForumThread'
import WorldSpeakArena from './pages/WorldSpeakArena'
import Gauntlet from './pages/Gauntlet'
import RoundTable from './pages/RoundTable'
import Ledger from './pages/Ledger'
import Oracle from './pages/Oracle'
import Vault from './pages/Vault'
import InnerTemple from './pages/InnerTemple'
import About from './pages/About'
import { ForumProvider } from './state/forumState'
import { RealmProvider } from './store/realmState'

const baseUrl = import.meta.env.BASE_URL
const basename = baseUrl === '/' ? '/' : baseUrl.replace(/\/$/, '')

const router = createBrowserRouter([
  { path:'/', element:<App />, children:[
    { index:true, element:<EntryGate /> },
    { path:'home', element:<Home /> },
    { path:'nexus', element:<Nexus /> },
    { path:'chronomap', element:<ChronoMap /> },
    { path:'forum/:id', element:<ForumThread /> },
    { path:'gauntlet', element:<Gauntlet /> },
    { path:'round-table', element:<RoundTable /> },
    { path:'arena', element:<WorldSpeakArena /> },
    { path:'ledger', element:<Ledger /> },
    { path:'inner-temple', element:<InnerTemple /> },
    { path:'oracle', element:<Oracle /> },
    { path:'vault', element:<Vault /> },
    { path:'about', element:<About /> },
  ]}
], { basename })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ForumProvider>
      <RealmProvider>
        <RouterProvider router={router} />
      </RealmProvider>
    </ForumProvider>
  </React.StrictMode>
)
