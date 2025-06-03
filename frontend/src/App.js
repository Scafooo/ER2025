import React, { useEffect, useState } from 'react';
import { HashRouter } from 'react-router-dom'
import './App.css';
import LoginPage from './pages/main/LoginPage'
import MainLayout from './pages/main/MainLayout'
import { Layout, notification } from 'antd';
import { checkUpdates } from './api/GeneralApi'
import ErrorBoundary from './pages/components/ErrorBoundary';
import { logout as logoutAPI } from './api/UsersApi';
import { TourProvider } from '@reactour/tour';
import { steps } from './pages/main/tour/steps';

function App() {
  const [logged, setLogged] = useState(localStorage.getItem('headers') !== null ? true : false)

  useEffect(() => {
    (localStorage.getItem('language') === null || localStorage.getItem('language') === undefined)
      && localStorage.setItem('language', 'en')
    checkUpdates()
  }, [])

  const login = () => {
    notification.destroy()
    setLogged(true)
  }

  const logout = () => {
    logoutAPI()
    localStorage.removeItem('username')
    localStorage.removeItem('headers')
    localStorage.removeItem('mastroQueryCatalog')
    localStorage.removeItem('kgQueryCatalog')
    setLogged(false)
  }

  return (
    <HashRouter>
      <ErrorBoundary>
        <Layout>
          {logged ?
            <TourProvider
              badgeContent={({ totalSteps, currentStep }) => currentStep + 1 + "/" + totalSteps}
              showNavigation={false}
              steps={steps}
            >
              <MainLayout logout={logout} />
            </TourProvider>
            :
            <LoginPage login={login} />}
        </Layout>
      </ErrorBoundary>
    </HashRouter>
  );

}

export default App;