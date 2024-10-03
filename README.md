# Game Of Go
A Go/Weiqi/Baduk Progressive Web Application

# What is this?
This is a Go sparring partner for single digit kyu and
low dan players to practice and improve their Go skills.

# What is the AI behind it?
A small early 6 block KataGo neural net, around 4Mb in size (kata1-b6c96-s175395328-d26788732)
stripped off the KataGo engine itself, there is no MCTS or any other search algorithm involved,
so you play against the bare net.

# Why not the latest KataGo net?
Using bigger (stronger) nets is possible but it takes
10-20 seconds to make a move which is super annoying.
Another reson is that latest networks are simply too strong.

# How strong is it?
Dan level is around FOX 1-2 dan, it beats Pachi [1sec/move], CrazyStone [1d] and looses to CrazyStone [2d]<br>
Kyu level is around FOX 6-5 kyu, it's around of GnuGo 3.8 strength.<br>
Its "understanding" is around FOX 5 dan but it often dies due to lack of
tactical reading, however against weaker players its tesuji moves feel
quite severe.

# How can I use it?
 - play in <a href="https://maksimkorzh.github.io/go/">web browser</a> on desktop or mobile device
 - install as PWA (Progressive Web Application) to your desktop or mobile device

# How to install it as PWA?
 - Open Chrome browser
 - DESKTOP: **Menu -> Cast, save and share -> Install Game Of Go**
 - MOBILE: **Menu -> Add to home screen -> Install**

NOTE: If you want reinstall/update make sure to clear cache first.
<br>
 - DESKTOP: Load page: **https://maksimkorzh.github.io/go/**
 - DESKTOP: **DevTools -> Application -> Service workers -> Unregister**
 - DESKTOP: **DevTools -> Network -> Disable cache**
 - DESKTOP: Reload page
<br><br>
 - MOBILE: Load page: **https://maksimkorzh.github.io/go/**
 - MOBILE: **Menu -> Settings -> Site settings -> All sites -> maksimkorzh.github.io -> [trash icon]**
 - MOBILE: Reload page

# Support
Please use github <a href="https://github.com/maksimKorzh/go/issues">issues</a> to communicate.

# Donations
PayPal: **maksymkorzh@gmail.com**

# Video overview
Coming soon...
