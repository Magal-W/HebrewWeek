# syntax=docker/dockerfile:1

FROM rust:bullseye as build

WORKDIR /app

RUN --mount=type=bind,source=src,target=src \
    --mount=type=bind,source=Cargo.toml,target=Cargo.toml \
    --mount=type=bind,source=Cargo.lock,target=Cargo.lock \
    --mount=type=cache,target=/usr/local/cargo/registry/ \
    --mount=type=cache,target=/app/target \
    <<EOF
cargo build --locked --release
cp ./target/release/hebrew-week /app/hebrew-week
EOF

FROM debian:bullseye-slim AS final
COPY --from=build /app/hebrew-week /hebrew-week

EXPOSE 3000

CMD ["/hebrew-week"]