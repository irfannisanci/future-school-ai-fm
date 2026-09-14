# ADR-002 — Local-first State

**Status:** Accepted

## Context
MVP'de öğrenci hesabı veya kalıcı backend gereksinimi yok. Gizlilik ve kurulum sadeliği önemli.

## Decision
Önce local state + localStorage; veritabanı yok.

## Consequences
Kurulum basit ve gizlilik güçlü. Cihazlar arası senkronizasyon yok; bu MVP için kabul edilir.