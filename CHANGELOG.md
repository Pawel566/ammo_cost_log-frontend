# Changelog

## [0.5.5] – 2025-01-XX
### Dodano
- System rang użytkowników wyświetlany na stronie Pulpit (Dashboard)
- Pasek postępu do następnej rangi z tooltipem wyjaśniającym zasady naliczania rang
- Wyświetlanie rangi użytkownika na stronie "Moje konto" obok nazwy użytkownika i emaila
- Tooltip na pasku postępu z informacją o wymaganej celności dla danego poziomu doświadczenia
- Licznik zaliczonych sesji strzeleckich na stronie Pulpit i Moje konto
- Automatyczne odświeżanie rangi po dodaniu, edycji lub usunięciu sesji strzeleckiej

### Zmieniono
- Zmieniono "Mało amunicji" na "Stan amunicji" na stronie Pulpit
- Wyświetlanie wszystkich pozycji amunicji z nazwą, kalibrem i ilością sztuk z magazynu
- Ustawienia motywu (jasny/ciemny) są teraz permanentnie przypisane do użytkownika, który je zmienił
- Kolejność providerów w `App.jsx` - `AuthProvider` jest teraz na zewnątrz `ThemeProvider` dla poprawnej obsługi odświeżania motywu

## [0.5.0] – 2025-01-XX
### Dodano
- Analiza zdjęć tarczy strzeleckiej przy użyciu AI
- Możliwość przesłania zdjęcia tarczy i automatycznego wykrywania trafień
- Jasny motyw interfejsu użytkownika (oprócz istniejącego ciemnego motywu)
- Przełącznik motywu w ustawieniach użytkownika

## [0.4.0] – 2025-01-XX
### Dodano
- Wyświetlanie poziomu doświadczenia użytkownika w szczegółach sesji strzeleckiej (pod celnością)

### Zmieniono
- Usunięto przycisk "Wygeneruj komentarz AI" ze szczegółów sesji strzeleckiej

## [0.3.8] – 2025-11-24
### Dodano
- Przerobiono stronę ustawień (SettingsPage) na 4 sekcje zgodnie z nowym designem:
  - **Ogólne**: wybór motywu (Jasny/Ciemny) i jednostek (Metry/Yardy)
  - **Konserwacja**: edytowalne limity strzałów i czasu między konserwacjami
  - **Powiadomienia**: toggle dla powiadomień o konserwacji i niskiej amunicji
  - **Sztuczna inteligencja**: checkboxy dla intensywności analizy i automatycznych komentarzy

### Zmieniono
- MyWeaponsPage.jsx i GunsPage.jsx używają teraz ustawień użytkownika zamiast hardkodowanych wartości:
  - Limit strzałów do konserwacji pobierany z ustawień użytkownika
  - Limit czasu między konserwacjami pobierany z ustawień użytkownika
  - Progi ostrzeżeń obliczane dynamicznie na podstawie limitów użytkownika (60% dla strzałów, 33% dla dni)
- Dodano logikę ukrywania ikon statusu konserwacji, gdy powiadomienia o konserwacji są wyłączone
- Status konserwacji jest teraz obliczany na podstawie indywidualnych ustawień użytkownika

### Naprawiono
- Poprawiono wyświetlanie statusu konserwacji - używa teraz limitów z ustawień zamiast stałych wartości (500 strzałów, 60/30 dni)

## [0.3.7.1] – 2025-11-22
### Naprawiono
- Naprawiono błędy związane z edycją i usuwaniem sesji strzeleckich
- Poprawiono obsługę błędów 422 przy PATCH sesji
- Naprawiono problemy z serializacją odpowiedzi z backendu

### Zmieniono
- Zaktualizowano integrację z nowymi endpointami sesji strzeleckich
- Ujednolicono format danych wysyłanych do backendu (date jako string ISO, distance_m jako float)

## [0.3.5] – 2025-11-17
### Dodano
- Strona zarządzania kontem użytkownika (AccountPage)
- Panel konserwacji broni (MaintenancePage)
- Strona ustawień użytkownika (SettingsPage)
- Zarządzanie wyposażeniem i akcesoriami do broni
- Strona sesji strzeleckich (ShootingSessionsPage)
- Strona dodawania sesji strzeleckich (AddShootingSessionPage)
- Strona "Moja broń" (MyWeaponsPage)

### Zmieniono
- Rozszerzona funkcjonalność zarządzania sprzętem strzeleckim
- Ulepszona nawigacja między sekcjami aplikacji

## [0.3.1] – 2025-11-XX
### Dodano
- Pełny system autoryzacji z AuthContext (logowanie, rejestracja, wylogowanie)
- Strony Login i Register z formularzami
- Menu użytkownika w navbarze z opcjami (Moje konto, Statystyki, Wyloguj)
- Automatyczne ustawianie nagłówka Authorization z tokenem
- Walidacja błędu 409 (email już istnieje) przy rejestracji
- Polskie tłumaczenia interfejsu

### Zmieniono
- Rejestracja nie loguje automatycznie - wymaga ręcznego logowania
- Przyciski logowania/rejestracji przeniesione ze strony głównej na dedykowane strony
- Integracja z backendem przez nagłówek Authorization Bearer token

## [0.3.0] – 2025-11-13
### Dodano
- Obsługa trybu gościa i logowania opartego na Supabase
- Integracja z backendowymi endpointami paginacji (`limit`/`offset`/`search`)
- Konfiguracja komentarzy AI z modelem `gpt-4o-mini`

### Zmieniono
- Ujednolicone opisy i instrukcje uruchomienia zgodne z backendem 0.3.0


## [0.2.0] – 2025-11-05
### Zmieniono
- Dodano warstwę serwisową (`app/services/`) – logika przeniesiona z routerów
- Ulepszona obsługa błędów z backendu
- Poprawiono strukturę projektu (routery = routing, serwisy = logika)

