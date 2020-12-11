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

url="https://github.com/MediaComem/rps/releases/download/v${version}/prebuild.tar.gz"
#curl -sSLo tmp/prebuild.tar.gz "$url"
echo "Downloaded prebuilt package from $url"

tar -xzf tmp/prebuild.tar.gz
echo "Uncompressed build into place"

if test -n "$title" && [ "$title" != "undefined" ]; then
  sed -i "s/<title>.*<\/title>/<title>$title<\/title>/" public/index.html
  echo "Title updated in public/index.html"
fi

rm -f tmp/prebuild.tar.gz
