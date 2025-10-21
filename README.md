# 🎯 Ammo Cost Log - Frontend

Frontend aplikacji do śledzenia kosztów strzelania - stworzony w React + Vite.  
Pozwala zarządzać bronią, amunicją oraz sesjami strzeleckimi z automatycznym liczeniem kosztów i podsumowaniem miesięcznym.

---

## 🧱 Stack technologiczny

| Warstwa | Technologia | Opis |
|----------|--------------|------|
| Frontend | **React 18** | główny framework aplikacji |
| Bundler | **Vite** | szybki bundler i serwer deweloperski |
| Routing | **React Router DOM** | nawigacja między stronami |
| HTTP Client | **Axios** | komunikacja z API |
| Styling | **CSS** | własne style bez dodatkowych bibliotek |

---

## 🚀 Funkcjonalności

- **Zarządzanie bronią** - dodawanie/usuwanie broni z kalibrem i notatkami
- **Zarządzanie amunicją** - dodawanie/usuwanie amunicji z ceną i ilością
- **Sesje strzeleckie** - rejestrowanie sesji z automatycznym liczeniem kosztów
- **Podsumowania** - miesięczne zestawienia kosztów i statystyk
- **Walidacja danych** - sprawdzanie poprawności wprowadzanych danych
- **Responsywny design** - działa na urządzeniach mobilnych i desktop

---

## 🧩 Struktura projektu

```plaintext 
ammo_cost_log-frontend/
│
├── public/                 # Pliki statyczne
├── src/
│   ├── components/        # Komponenty React (puste)
│   ├── pages/            # Strony aplikacji
│   │   ├── AmmoPage.jsx   # Zarządzanie amunicją
│   │   ├── GunsPage.jsx   # Zarządzanie bronią
│   │   ├── SessionsPage.jsx # Sesje strzeleckie
│   │   └── SummaryPage.jsx # Podsumowania
│   ├── services/
│   │   └── api.js         # Konfiguracja API
│   ├── styles/           # Style CSS (puste)
│   ├── App.jsx           # Główny komponent
│   ├── App.css           # Style główne
│   ├── index.css         # Style globalne
│   └── main.jsx          # Punkt wejścia
├── package.json          # Zależności i skrypty
├── vite.config.js        # Konfiguracja Vite
└── README.md             # Ten plik

```

---

## 🛠️ Instalacja i uruchomienie

### Wymagania
- Node.js (wersja 16 lub nowsza)
- npm lub yarn

### Instalacja zależności
```bash
npm install
```

### Uruchomienie serwera deweloperskiego
```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: `http://localhost:3000`

### Budowanie na produkcję
```bash
npm run build
```

### Podgląd zbudowanej aplikacji
```bash
npm run preview
```

---

## 🔧 Konfiguracja

### Proxy API
Aplikacja używa proxy Vite do komunikacji z backendem:

```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

### API Configuration
```javascript
// src/services/api.js
const API_BASE_URL = '/api';  // Używa proxy Vite
```

---

## 📱 Użytkowanie

### 1. Zarządzanie bronią
- Dodaj broń z nazwą, kalibrem i notatkami
- Usuń niepotrzebną broń
- Przeglądaj listę wszystkich broni

### 2. Zarządzanie amunicją
- Dodaj amunicję z ceną za sztukę i ilością w opakowaniu
- Usuń niepotrzebną amunicję
- Śledź pozostałą ilość amunicji

### 3. Sesje strzeleckie
- Wybierz broń i amunicję
- Podaj datę i liczbę strzałów
- Dodaj notatki do sesji
- Automatyczne liczenie kosztów

### 4. Podsumowania
- Przeglądaj miesięczne zestawienia kosztów
- Sprawdź łączną liczbę strzałów
- Oblicz średni koszt za strzał
- Wizualizacja danych na wykresie

---

## 🔗 Komunikacja z backendem

Frontend komunikuje się z backendem przez:
- **GET** `/api/guns/` - pobieranie listy broni
- **POST** `/api/guns/` - dodawanie nowej broni
- **DELETE** `/api/guns/{id}` - usuwanie broni
- **GET** `/api/ammo/` - pobieranie listy amunicji
- **POST** `/api/ammo/` - dodawanie nowej amunicji
- **DELETE** `/api/ammo/{id}` - usuwanie amunicji
- **GET** `/api/sessions/` - pobieranie sesji
- **POST** `/api/sessions/` - dodawanie sesji
- **GET** `/api/sessions/summary` - podsumowania miesięczne

---

## 🎨 Style i design

Aplikacja używa własnych stylów CSS bez dodatkowych bibliotek:
- **Responsywny design** - działa na wszystkich urządzeniach
- **Nowoczesny interfejs** - czyste linie i intuicyjna nawigacja
- **Kolory** - niebieski (#007bff), czerwony (#dc3545), zielony (#28a745)
- **Typografia** - systemowe czcionki dla lepszej wydajności

---

## 🐛 Rozwiązywanie problemów

### Problem: Nie można dodać broni/amunicji/sesji
**Rozwiązanie:** Sprawdź czy backend działa na porcie 8000 i czy ma skonfigurowany CORS.

### Problem: Błędy CORS
**Rozwiązanie:** Backend musi mieć skonfigurowany CORS dla `http://localhost:3000`.

### Problem: Proxy nie działa
**Rozwiązanie:** Sprawdź konfigurację w `vite.config.js` i czy backend działa.

---

## 📝 Skrypty npm

- `npm run dev` - uruchomienie serwera deweloperskiego
- `npm run build` - budowanie na produkcję
- `npm run preview` - podgląd zbudowanej aplikacji
- `npm run lint` - sprawdzenie kodu ESLint

---

## 🔄 Wersja 0.1

- Podstawowe CRUD operacje dla broni, amunicji i sesji
- Automatyczne liczenie kosztów sesji
- Walidacja danych wejściowych
- Miesięczne podsumowania kosztów
- Responsywny design
- Integracja z backendem FastAPI