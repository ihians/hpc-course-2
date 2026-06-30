# ── Base image ────────────────────────────────────────────────────────────────
# nginx:alpine is a very small image (~8MB) — ideal for serving static files
FROM nginx:alpine

# ── Remove the default Nginx page ─────────────────────────────────────────────
RUN rm -rf /usr/share/nginx/html/*

# ── Copy static frontend files ────────────────────────────────────────────────
COPY index.html /usr/share/nginx/html/
COPY style.css  /usr/share/nginx/html/
COPY app.js     /usr/share/nginx/html/

# ── Copy our Nginx configuration ──────────────────────────────────────────────
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ── Expose port 80 ────────────────────────────────────────────────────────────
EXPOSE 80

# ── Start Nginx in the foreground ─────────────────────────────────────────────
CMD ["nginx", "-g", "daemon off;"]
