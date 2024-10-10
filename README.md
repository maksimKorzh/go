# Game Of Go
A Go/Weiqi/Baduk Progressive Web Application

# What is this?
This is a Go sparring AI partner for single digit kyu and
low dan players to practice and improve their Go skills.

# What is the AI behind it?
KYU level (6 block net, ~4MB): kata1-b6c96-s175395328-d26788732<br>
DAN level:(10 block net ~11MB): kata1-b10c128-s1141046784-d204142634<br><br>
There is no MCTS or any other search algorithm involved, so you play against the bare net.

# Why not the latest KataGo net?
Using bigger (stronger) nets is possible but it takes
10-20 seconds to make a move which is super annoying.
Another reson is that latest networks are simply too strong.

# How strong is it?
Dan level is around OGS 1 dan<br>
Kyu level is around OGS 5 kyu<br>

# How can I use it?
 - play in <a href="https://maksimkorzh.github.io/go/">web browser</a> on desktop or mobile device
 - install as PWA (Progressive Web Application) to your desktop or mobile device

# How to install it as PWA?
 - Open Chrome browser
 - DESKTOP: **Menu -> Cast, save and share -> Install Game Of Go**
 - MOBILE: **Menu -> Add to home screen -> Install**

# How to update PWA to latest version?
PWAs DO NOT get updated automatically when you refresh page because the core idea of PWA
is to work as a stand-alone offline app and for the that sake chache is used, so without
clearing the cache manually there would be no actual update, hence you need to make sure
you've cleared the cache on your device. This is how it can be achieved:
<br>
 - DESKTOP: Load page: **https://maksimkorzh.github.io/go/**
 - DESKTOP: **DevTools -> Application -> Service workers -> Unregister**
 - DESKTOP: **DevTools -> Network -> Disable cache**
 - DESKTOP: Reload page
<br><br>
 - MOBILE: Load page: **https://maksimkorzh.github.io/go/**
 - MOBILE: **Menu -> Settings -> Site settings -> All sites -> maksimkorzh.github.io -> [trash icon]**
 - MOBILE: Reload page

 Now you can uninstall PWA from desktop/mobile device and install it again.

# How to run it as KGS bot (EXPERIMENTAL)
The way I do it is weird and really far from best practices, however it works,
so here's the setup I use to use this app as KGS bot:
 - **cd go**
 - **python3 -m http.server** this is needed to host NN weights
 - **cd /path/to/kgsGtp/**
 - **java -jar kgsGtp.jar config.ini
    // example 'config.ini'
    name=your_kgs_bot_account
    password=password
    room=Computer Go
    mode=custom
    gameNotes=Bare KataGo net with no MCTS, around 1d strength
    talk=direct chat wouldresponse with this message
    verbose=t
    engine=node /path/to/go/gtp/gtp.js

# Known issues
Since there's no MCTS search, a bare net is vulnerable to tacical blunders,
it should not fall into the obvious ladder but a ladder where one stone is
in atari might run thinking it can be saved. It may also think it's killing a group
while on the real deal it's dead, this results in score evaluation jumps.

# Support / Developers
Please use github <a href="https://github.com/maksimKorzh/go/issues">issues</a> to communicate.

# Donations
PayPal: **maksymkorzh@gmail.com**

# Video overview
[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/5-ds-vygmRk/0.jpg)](https://www.youtube.com/watch?v=5-ds-vygmRk)
