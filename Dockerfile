# Stage 1: Build and cache dependencies
FROM denoland/deno:1.44.4 AS builder

# Proxy settings are now passed during 'docker run' or 'docker build'
# See updated instructions.

WORKDIR /app

# Copy all source files required for caching
COPY deno.json .
COPY *.ts ./
COPY api/ /app/api/

# Explicitly create the lock file
RUN deno cache --lock=deno.lock --lock-write main.ts

# Stage 2: Create the final, lean image
FROM denoland/deno:1.44.4

WORKDIR /app

# Copy lock file and cached dependencies from the builder stage
COPY --from=builder /app/deno.lock .
COPY --from=builder /deno-dir /deno-dir

# Copy application code
COPY public/ /app/public/
COPY *.ts ./
COPY api/ /app/api/

ENV TRAFFIC_LIMIT=yes

EXPOSE 8000

# Run the app using the cached dependencies and lock file
CMD ["run", "--allow-net", "--allow-read", "--allow-env=TRAFFIC_LIMIT", "--lock=deno.lock", "main.ts"]

