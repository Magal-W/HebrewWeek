FROM rust:bullseye AS helix_builder
RUN git clone https://github.com/helix-editor/helix.git /helix
WORKDIR /helix
RUN cargo install --path helix-term --locked
RUN hx --grammar fetch
RUN hx --grammar build

FROM node:bullseye

RUN useradd -ms /bin/bash user
RUN usermod -aG sudo user

COPY --from=helix_builder --chown=root:root /helix /opt/helix
RUN ln -s /opt/helix/target/release/hx /usr/local/bin
RUN mkdir /home/user/.config
RUN mkdir /home/user/.config/helix
# RUN chown -R user:users /opt/helix/runtime
RUN ln -s /opt/helix/runtime /home/user/.config/helix

RUN apt update
RUN apt -y install sudo
RUN apt -y install curl
RUN apt -y install gcc
RUN apt -y install git

USER user
RUN mkdir /home/user/HebrewWeek
WORKDIR /home/user/HebrewWeek
COPY . .

RUN curl https://sh.rustup.rs -sSf | bash -s -- -y
ENV PATH="/home/user/.cargo/bin:${PATH}"

WORKDIR /home/user/HebrewWeek/client
RUN npm install --silent

WORKDIR /home/user/HebrewWeek
RUN --mount=type=cache,target=/usr/local/cargo/registry/ \
    --mount=type=cache,target=/app/target \
    cargo install cargo-chef --locked
RUN --mount=type=cache,target=/usr/local/cargo/registry/ \
    --mount=type=cache,target=/app/target \
    cargo chef prepare --recipe-path /tmp/recipe.json
RUN --mount=type=cache,target=/usr/local/cargo/registry/ \
    --mount=type=cache,target=/app/target \
    cargo chef cook --recipe-path /tmp/recipe.json
RUN --mount=type=cache,target=/usr/local/cargo/registry/ \
    --mount=type=cache,target=/app/target \
    cargo chef cook --release --recipe-path /tmp/recipe.json

WORKDIR /home/user

ENTRYPOINT /bin/bash
