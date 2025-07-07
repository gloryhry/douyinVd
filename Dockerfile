# Stage 1: Build and cache dependencies
FROM denoland/deno:1.37.2 AS builder

# Set proxy for the build stage
ENV https_proxy=http://127.0.0.1:7890
ENV http_proxy=http://127.0.0.1:7890
ENV all_proxy=http://127.0.0.1:7890

WORKDIR /app

# Copy all source files required for caching
COPY deno.json .
COPY *.ts ./
COPY api/ /app/api/

# Explicitly create the lock file
RUN deno cache --lock=deno.lock --lock-write main.ts

# Stage 2: Create the final, lean image
FROM denoland/deno:1.37.2

WORKDIR /app

# Copy lock file and cached dependencies from the builder stage
COPY --from=builder /app/deno.lock .
COPY --from=builder /root/.cache/deno /root/.cache/deno

# Copy application code
COPY public/ /app/public/
COPY *.ts ./
COPY api/ /app/api/

EXPOSE 8000

# Run the app using the cached dependencies and lock file
CMD ["run", "--allow-net", "--allow-read", "--lock=deno.lock", "main.ts"]

