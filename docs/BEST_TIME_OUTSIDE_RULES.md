# BEST_TIME_OUTSIDE_RULES.md

# Rain & Precipitation Intelligence

The “Best Time Outside” feature must also consider:

* rain probability
* precipitation intensity
* drizzle
* thunderstorms
* snow (future support)

Outdoor recommendations must NOT rely only on:

* AQI
* temperature
* UV
* humidity

Rain and precipitation conditions are critical for:

* comfort
* safety
* activity planning
* user trust

---

# New Environmental Inputs

Add:

## Precipitation Data

* rain probability (%)
* rainfall intensity
* drizzle conditions
* thunderstorm alerts

Use weather forecast APIs to evaluate:

* hourly precipitation
* short-term forecast windows

---

# Rain-Based Recommendation Rules

## Excellent Outdoor Conditions

Recommend outdoor activity when:

* low AQI
* comfortable temperature
* low UV
* no expected rain

---

# Moderate Conditions

Use caution when:

* light drizzle expected
* intermittent rain probability
* moderate wind conditions

Recommendations should:

* shorten outdoor windows
* suggest umbrellas if needed

---

# Poor Outdoor Conditions

Avoid outdoor activity when:

* heavy rain expected
* thunderstorms detected
* storm alerts active
* slippery conditions likely

---

# Rain-Aware Time Window Logic

The recommendation engine should dynamically identify:

* dry windows
* lower-rain intervals
* comfortable outdoor periods

Example:

Avoid:
12PM–3PM → heavy rain expected

Recommended:
5PM–7PM → lower precipitation and cooler conditions

---

# Updated Recommendation Categories

## Excellent

Clear weather and healthy environmental conditions.

## Good

Minor environmental concerns.

## Moderate

Light rain or moderate AQI.

## Poor

Heavy rain or elevated pollution.

## Dangerous

Storms, extreme heat, or hazardous AQI.

---

# Updated Recommendation Format

Example:

Best Time Outside:
6PM – 8PM

Environmental Status:
Good

Why:
Lower temperatures and reduced rain probability are expected during this period.

Suggestions:
Good time for walking and outdoor exercise.
Carry a light jacket if rain probability increases.

---

# Heavy Rain Example

Best Time Outside:
After 7PM

Environmental Status:
Moderate Risk

Why:
Heavy rain and elevated humidity are expected during the afternoon.

Suggestions:
Avoid outdoor activities between 1PM–5PM due to rain intensity and slippery conditions.

---

# Thunderstorm Handling

If thunderstorms are detected:

Environmental Status:
Dangerous

Recommendation:
Avoid outdoor activity until weather conditions improve.

The system should prioritize:

* user safety
* weather severity
* real-world usability

---

# Rain Probability Thresholds

## Excellent

Rain probability < 10%

## Good

Rain probability 10%–25%

## Moderate

Rain probability 25%–50%

## Poor

Rain probability 50%–75%

## Dangerous

Rain probability > 75%
or thunderstorm alerts active

---

# Suggested Activities Logic

## Clear Conditions

* walking
* jogging
* cycling
* gardening

## Light Rain

* short walks
* indoor/outdoor flexible activities

## Heavy Rain

* avoid prolonged outdoor exposure

---

# UI Requirements

Add:

* rain probability icon
* precipitation indicators
* umbrella suggestion icon
* weather severity labels

The feature should visually feel:

* intelligent
* weather-aware
* practical

NOT:

* overly technical

---

# AI Tone Rules

Recommendations must sound:

* calm
* practical
* helpful
* conversational

Avoid:

* robotic weather warnings
* scientific wording
* generic AI language

---

# Product Experience Goal

Users should feel:

“This app understands both environmental quality and actual outdoor comfort.”

The feature should combine:

* climate intelligence
* wellness recommendations
* weather awareness
* practical daily usability
