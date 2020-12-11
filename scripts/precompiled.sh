#/usr/bin/env bash
set -e

title=$(node -e 'console.log(require("./package.json").title);')
version=$(node -e 'console.log(require("./package.json").version);')

if test -z "$title" || [ "$title" == "undefined" ]; then
  title="Rock Paper Scissors"
fi

echo "Project title is $title"
echo "Project version is $version"

mkdir -p tmp

if test -f tmp/precompiled-force.tar.gz; then
  cp tmp/precompiled-force.tar.gz tmp/precompiled.tar.gz
  echo "Using existing precompiled package tmp/precompiled-force.tar.gz"
else
  url="https://github.com/MediaComem/rps/releases/download/v${version}/precompiled.tar.gz"
  curl -sSLo tmp/precompiled.tar.gz "$url"
  echo "Downloaded precompiled package from $url"
fi

tar -xzf tmp/precompiled.tar.gz
echo "Uncompressed precompiled build into place"

if test -n "$title" && [ "$title" != "undefined" ]; then
  escaped_title="$(echo "$title"|sed 's/&/\&amp;/g; s/</\&lt;/g; s/>/\&gt;/g; s/"/\&quot;/g; s/'"'"'/\&#39;/g')"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/<title>.*<\/title>/<title>$escaped_title<\/title>/" public/index.html
  else
    sed -i "s/<title>.*<\/title>/<title>$escaped_title<\/title>/" public/index.html
  fi

  echo "Title updated in public/index.html"
fi

rm -f tmp/precompiled.tar.gz
