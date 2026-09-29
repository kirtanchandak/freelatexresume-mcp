FROM node:22-bookworm-slim AS base

# Step 1: Install pdflatex (TeX Live)
# We use the slim debian image and install just the necessary texlive packages
# to keep the image size reasonable.
RUN apt-get update && apt-get install -y \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-latex-extra \
    texlive-xetex \
    && rm -rf /var/lib/apt/lists/*

# Step 2: Set up the Node.js application
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Add build args for Next.js prerendering
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Build the Next.js app
RUN npm run build

# Expose the port Next.js runs on
EXPOSE 3005

# Start the application
CMD ["npm", "start"]
