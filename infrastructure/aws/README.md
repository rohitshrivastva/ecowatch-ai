# AWS Deployment Guide

## Architecture

```
Internet → ALB → ECS (Frontend + Backend) → RDS PostgreSQL + ElastiCache Redis
```

## Services

| Service | AWS Resource | Purpose |
|---------|-------------|---------|
| Frontend | ECS Fargate + ALB | Next.js dashboard |
| Backend | ECS Fargate + ALB | FastAPI API |
| Database | RDS PostgreSQL + PostGIS | Environmental snapshots |
| Cache | ElastiCache Redis | API response caching |

## Deployment Steps

1. **ECR**: Push Docker images to Amazon ECR
2. **RDS**: Create PostgreSQL instance with PostGIS extension
3. **ElastiCache**: Create Redis cluster
4. **ECS**: Deploy Fargate tasks with environment variables from Secrets Manager
5. **ALB**: Configure path-based routing (`/` → frontend, `/api` → backend)

## Environment Variables (Secrets Manager)

- `OPENWEATHER_API_KEY`
- `WAQI_API_KEY`
- `OPENAI_API_KEY`
- `DATABASE_URL`
- `REDIS_URL`

## Estimated Monthly Cost (MVP)

- ECS Fargate (2 tasks): ~$30
- RDS db.t3.micro: ~$15
- ElastiCache cache.t3.micro: ~$12
- ALB: ~$20
- **Total: ~$77/month**
