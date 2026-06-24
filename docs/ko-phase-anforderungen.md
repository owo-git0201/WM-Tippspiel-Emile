# K.O.-Phase: Anforderungskatalog
*Umsetzung geplant: Samstag 28.06.2026 — vor dem ersten Achtelfinale*

---

## 1. Gruppenphase einklappen

Gespielte Gruppenspiele werden auf der Startseite standardmäßig eingeklappt.
- Nutzer sieht zunächst nur noch nicht gespielte Spiele + K.O.-Spiele
- Gruppenphase bleibt als aufklappbarer Bereich erhalten (Punkte nachvollziehen)
- Label z.B. „Gruppenphase — 48 Spiele (abgeschlossen) ▾"
- Zustand wird nicht gespeichert (nach Reload wieder eingeklappt ist ok)

---

## 2. K.O.-Tippansicht

- K.O.-Spiele erscheinen oben auf der Startseite, Gruppenphase darunter eingeklappt
- Visuelle Unterscheidung zu Gruppenspielen (Badge, Farbe o.ä.)
- Rundenbezeichnung gut sichtbar: Achtelfinale / Viertelfinale / Halbfinale / Finale

---

## 3. K.O.-Tipp-Mechanik

**Tippfelder pro K.O.-Spiel:**
- Ergebnis nach 90 Minuten (Heimsieg / Unentschieden / Auswärtssieg + Tordifferenz)
- Unentschieden ist möglich → Spiel geht in V.H. oder Elfmeter
- Optional zusätzlich: „Wie wird entschieden?" → Verlängerung oder Elfmeter
  - Richtig getippt: **+1 Bonuspunkt**
  - Nur auswählbar wenn Tendenz = Unentschieden

**Punktewertung Basis (gilt für ALLE K.O.-Tipps):**

| Runde | Basis Tendenz | Basis Volltreffer |
|---|---|---|
| Achtelfinale | 4 Pkt (×2) | 8 Pkt (×2) |
| Viertelfinale | 6 Pkt (×3) | 12 Pkt (×3) |
| Halbfinale | 6 Pkt (×3) | 12 Pkt (×3) |
| Finale | 8 Pkt (×4) | 16 Pkt (×4) |

---

## 4. Powerspiel in der K.O.-Phase

**Name:** Bleibt „Powerspiel" — in K.O.-Runden trägt es zusätzlich das ⚠️-Risiko-Badge.

**Mechanik:** Powerspiel multipliziert das Erreichte ×3 — wie in der Gruppenphase. Neu: falscher Tipp kostet Minuspunkte.

**Minus-Regel (Option B, 3:1-Verhältnis):**
Minus = Basis-Volltreffer der Runde (= was man ohne PP für einen Volltreffer bekommen hätte).

| Runde | PP Tendenz | PP Volltreffer | PP Falsch |
|---|---|---|---|
| Achtelfinale | +12 Pkt | +24 Pkt | **−8 Pkt** |
| Viertelfinale | +18 Pkt | +36 Pkt | **−12 Pkt** |
| Halbfinale | +18 Pkt | +36 Pkt | **−12 Pkt** |
| Finale | +24 Pkt | +48 Pkt | **−16 Pkt** |

**Powerspiel-Slots K.O. (optional, nicht Pflicht):**
- **1× Achtelfinale** — wählbar auf eines der Achtelfinale-Spiele
- **1× Viertelfinale / Halbfinale / Finale** — wählbar auf eines der Spiele dieser drei Runden zusammen

Wer das Powerspiel im Finale einsetzt, hat das volle Risiko: −16 bei Fehltipp, +48 bei Volltreffer.

---

## 5. Regeln sichtbar erklären

**Wo:**
- Oben auf der Startseite, dauerhaft sichtbar (kompakt, aufklappbar)
- Einmalig als Hinweis-Banner beim ersten Seitenaufruf nach Beginn der K.O.-Phase

**Inhalt (Kurzversion für UI):**
> **K.O.-Phase — neue Regeln:**
> Alle Tipps zählen mehr: ×2 im Achtelfinale bis ×4 im Finale.
> Das Powerspiel multipliziert deinen Tipp ×3 — aber Vorsicht: falsch getippt gibt Minuspunkte.
> Du hast 2 Powerspiele für die gesamte K.O.-Phase.

---

## 6. Registrierung sperren ab 1. Juli 2026

- Registrierungsformular nicht mehr erreichbar
- Wer `/auth/register` aufruft, sieht freundliche Meldung:
  > „Die Anmeldephase ist beendet. Für die WM 2026 bist du leider zu spät — aber die nächste EM kommt bestimmt!"
- Bestehende Nutzer: kein Einfluss

---

## 7. „Spätstarter willkommen"-Badges entfernen

Alle Hinweise auf Spätanmeldung aus der UI entfernen:
- Badge / Text auf Startseite
- Hinweis auf Registrierungsseite
- Eventuelle Hinweise in Onboarding oder E-Mails

---

## Bewusst NICHT umgesetzt

- **Turnierbaum-Tipp** (zu viel Gamification, Multiplikator reicht)
- **Außenseiter-Bonus** (zu komplex für diesen Stand)
