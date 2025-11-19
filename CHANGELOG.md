# Changelog

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

