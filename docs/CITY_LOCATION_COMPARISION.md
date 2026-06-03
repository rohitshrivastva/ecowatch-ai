# CITY_COMPARISON_RULES.md

# Feature: City / Location Environmental Comparison

## Product Goal

Create a modern environmental comparison feature that allows users to compare two or more cities or locations based on environmental health and livability indicators.

The feature should feel:

* intelligent
* visual
* easy to understand
* shareable
* premium

NOT:

* overly technical
* spreadsheet-like
* metric overloaded

---

# Core UX Principle

Users should instantly understand:

* Which location is environmentally healthier?
* Which area has better outdoor conditions?
* Which city has lower environmental risk?
* Why does one location score better?

The comparison should prioritize:

* simplicity
* visual clarity
* actionable understanding

---

# Supported Comparisons

Allow comparison between:

* cities
* neighborhoods
* coordinates
* saved locations
* countries (future)

Examples:

* Dublin vs Cork
* London vs Paris
* Home vs Office
* Current Location vs Selected Area

---

# Primary Comparison Metrics

## Environmental Health Score

Main comparison metric.

Example:
Dublin → 78/100
Cork → 69/100

This should be the primary visual focus.

---

# Environmental Metrics

Compare:

* AQI
* temperature
* humidity
* vegetation score
* heat risk
* UV index
* rain probability
* air quality trend

---

# AI Comparison Summary

Generate concise AI-powered summaries.

Example:

“Dublin currently offers better outdoor environmental conditions due to lower AQI and cooler temperatures, while Cork shows higher humidity and moderate rain probability.”

The AI explanation should:

* sound human
* explain WHY
* avoid technical overload

---

# Comparison Categories

## Air Quality

* AQI
* PM2.5
* PM10

---

# Weather Conditions

* temperature
* feels-like
* humidity
* rainfall
* UV index

---

# Environmental Conditions

* vegetation density
* urban heat
* environmental risk
* outdoor comfort

---

# Best Time Outside Comparison

Compare:

* safest outdoor time windows
* rain conditions
* heat comfort
* outdoor suitability

Example:

Dublin:
Best Time → 7AM–10AM

Cork:
Best Time → 6PM–8PM

---

# Visual Comparison Requirements

The comparison page should visually resemble:

* modern climate-tech platform
* smart-city intelligence dashboard
* premium analytics product

NOT:

* admin panel
* spreadsheet UI

---

# UI Layout

## Top Section

Location selector.

---

# Hero Comparison Cards

Display:

* environmental score
* AQI
* temperature
* environmental status

Use:

* side-by-side comparison cards

---

# AI Summary Section

Display:

* AI-generated comparison insights
* key environmental differences
* recommendations

---

# Heatmap Comparison

Allow users to switch between:

* AQI heatmap
* temperature heatmap
* vegetation heatmap
* environmental risk heatmap

Only one active heatmap at a time.

---

# Historical Comparison

Compare:

* environmental trends
* AQI change
* heat increase
* vegetation loss

Support:

* 24h
* 7 days
* 30 days
* yearly comparison

---

# Recommendation Engine

Generate localized recommendations.

Example:

“For outdoor activities, Dublin currently provides healthier air quality and lower heat exposure compared to Cork.”

---

# Color Rules

## Excellent

Green

## Good

Light Green

## Moderate

Yellow

## Poor

Orange

## Dangerous

Red

---

# Risk Status Categories

## Excellent

Very healthy environmental conditions.

## Good

Generally comfortable conditions.

## Moderate

Some environmental concerns exist.

## Poor

Elevated pollution or weather risk.

## Dangerous

Unsafe environmental conditions.

---

# Product Design Rules

The comparison experience should:

* feel clean
* emphasize insights over raw numbers
* reduce cognitive overload
* highlight key differences quickly

Avoid:

* too many charts
* excessive tables
* overwhelming metrics

---

# Shareability Features (Future)

Support:

* shareable comparison links
* exported reports
* social cards
* public environmental profiles

Example:
ecowatchai.com/compare/dublin-vs-cork

---

# Performance Requirements

Implement:

* lazy loading
* progressive rendering
* cached environmental data
* optimized API calls

Avoid:

* loading all charts simultaneously
* blocking UI during comparison fetches

---

# Backend Requirements

Create APIs:

GET /compare
GET /compare/history
GET /compare/heatmaps

Support:

* multiple locations
* cached responses
* historical filtering

---

# AI Recommendation Rules

AI summaries should:

* explain WHY one city scores better
* mention environmental causes
* suggest outdoor suitability
* include rain and heat considerations

Avoid:

* robotic AI language
* generic recommendations
* repeated phrasing

---

# Product Positioning

This feature should make EcoWatch AI feel like:

* environmental intelligence platform
* climate comparison engine
* smart outdoor planning assistant

NOT:

* weather dashboard

---

# Final UX Goal

Users should immediately feel:

“I can clearly understand which location offers healthier and more comfortable environmental conditions.”

The experience should prioritize:

* clarity
* intelligence
* visual simplicity
* actionable insights
