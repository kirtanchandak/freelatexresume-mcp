FROM node:20-bookworm-slim AS base

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

# Build the Next.js app
RUN npm run build

# Expose the port Next.js runs on
EXPOSE 3005

# Start the application
CMD ["npm", "start"]
