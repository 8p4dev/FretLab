import { render } from 'preact'
import './index.css'
import App from './App'

render(<App />, document.getElementById('root')!)

// 새 서비스워커가 페이지를 넘겨받으면(배포 후 첫 방문) 바로 새로고침 — 안 하면 옛 번들이 한 번 더 보인다. 첫 설치 때는 안 한다
if ('serviceWorker' in navigator) {
  let had = !!navigator.serviceWorker.controller
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (had) location.reload(); had = true })
}
