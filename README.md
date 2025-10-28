# 🎯 Ammo Cost Log - Frontend

React frontend do aplikacji zarządzania strzelectwem z inteligentnym asystentem AI.

## ✨ Funkcjonalności

- **Zarządzanie sprzętem** - katalog broni i amunicji z cenami
- **Śledzenie kosztów** - sesje strzeleckie z automatycznym obliczaniem wydatków
- **Analiza celności** - pomiar wyników z komentarzami AI (GPT-5-mini)
- **Statystyki** - miesięczne podsumowania i wykresy

## 🛠️ Technologie

- React, Vite, React Router, CSS3

## 🚀 Instalacja

```bash
npm install
npm run dev
```

**Dostęp**: http://localhost:3000  
**Wymagania**: Backend uruchomiony na porcie 8000

## 📱 Strony aplikacji

- **Strona główna** (`/`) - opis aplikacji i nawigacja
- **Broń** (`/guns`) - zarządzanie bronią (dodaj, edytuj, usuń)
- **Amunicja** (`/ammo`) - zarządzanie amunicją
- **Sesje kosztowe** (`/cost-sessions`) - historia sesji z filtrowaniem
- **Sesje celnościowe** (`/accuracy-sessions`) - analiza celności z AI
- **Podsumowanie** (`/summary`) - statystyki i wykresy

## 🎨 Design

Szary motyw (#545454) z białym tekstem i zielonymi akcentami (#4caf50). Profesjonalne ikony SVG, responsywny layout, filtr wyszukiwania dla sesji.

## 🚀 Deployment

Automatyczny deployment na Vercel przez GitHub.

## 🔮 Plany na przyszłość

- Konta użytkowników z prywatnymi kolekcjami
- Poziomy zaawansowania
- Personalizacja AI komentarzy