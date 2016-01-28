#!/bin/sh

PATH=/usr/local/bin:/bin:/usr/bin

# 1. Edit this script's 'COMMON_STATIC' variable with your local SVN path
#
# 2. Link up this git hook up by copying, pasting, and executing this:
#
#      cd $(git rev-parse --show-toplevel) && chmod +x pre-push.sh && ln -s pre-push.sh .git/hooks/
#
# 3. PROFIT! After that before you push to GitHub this script will run and ensure the change is also copied to our SVN repo.

COMMON_STATIC="/Users/YOUR-USER-HERE/Documents/workspace/Common"

# Path mapping GitHub -> SVN: ./{css,js,fonts,images,vendors} --> ./global/assets/{css,js,fonts,images,vendors}
# NOTE: Trailing slash is important for rsync
GITHUB_CHECKOUT="$(git rev-parse --show-toplevel)"
SVN_ASSETS_PATH=$COMMON_STATIC"/Installation-Kit/staticfiles/static/global/assets/"
GITHUB_ASSETS_PATH=$GITHUB_CHECKOUT"/assets/"

echo -n "Connected to VPN? (y/n)? "
read answer
if echo "$answer" | grep -iq "^y" ;then
# Update both SVN repo and Github repo. SVN repo requires VPN.
  cd $COMMON_STATIC
  svn update
  echo "Syncing assets now, be sure to check for conflicts in SVN afterwards."
  # Sync up
  rsync -vur --delete --exclude=.DS_Store $GITHUB_ASSETS_PATH $SVN_ASSETS_PATH
else
  echo "Connect to VPN for this script to run, SVN update needs it..."
fi

