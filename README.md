# Update 2.0.0
ok, you may be thinking "dude, 4 days and already a major version update?". Well yeah, this may be a case of what you call bad planning, but this update changes hashes and point generation methods, although not all implemented yet, but hey, better late than never, even though it's only been about 4 days.

So here are the changes:
- hashes used to follow the format `resolution|row|col`, now they follow the format `mapOrientation|rotationMethod|resolution|row|col`.
- before there was `rotationMethod`, and it had to be provided for almost all `Icosahedron` instance methods, now there's also `mapOrientation` for when `dymaxion` orientation is added, and these now only have to be set when creating a new `Icosahedron` instead of every time you want to generate a hash or some points.

# hexmap

hexmap is a lazy-loading hexagon map. This means that it can hash locations, and it can also support hexagon navigation (not implemented yet). If you want to see it in action, check out this link [(CodeSandbox)](https://codesandbox.io/s/hex-map-dev-z0qc0?file=/src/sketch.ts) (ps, if you click on the hex map it generates another random point and its hash). If you want to know how it works, I explain it towards the bottom.

## installation

```
npm install hexmap --save
```

## usage

```
import { Icosahedron, point3, Vectors3 } from 'hexmap';
// or const { Icosahedron, point3, Vectors3 } = require('hexmap');

// generate point
const point = Vectors3.fromCoordinates({ lat: 36.05, lon: -112.14 });
// initialize icosahedron
const icosahedron = new Icosahedron({ mapOrientation: 'ECEF', rotationMethod: 'gnomonic' });
```
And then you can generate a hash.
```
const hash = icosahedron.generateHash({ p: point, res: 74 });
```
And generate a point from it, and its icosahedron (same mapOrientation and rotationMethod as point)
```
const [parsedIcosahedron, parsedPoint] = Icosahedron.parseHash(hash);
```
And that's pretty much it, for hashes at least. If you're wondering about `res` (resolution), there's a table with estimated hexagon radius below, and if you're wondering about `rotationMethod`, don't worry about it, but if you're already worrying about it you can see the difference between them at [(CodeSandbox)](https://codesandbox.io/s/hex-map-dev-z0qc0?file=/src/sketch.ts), just set `tripBalls` to true and it'll make sense.

If you're thinking "that's it?", well for now yes. There's more stuff that this baby can do, it just needs to be added, see at the bottom for subreddit and contact info, and if people request stuff it'll almost definitely be added, as long as it's coherent with the project.

# estimated hex radius for resolutions

Now, this might push the boundaries of the word estimation, since the way I calculated it is ≈ 63.435 degrees (angle between 2 icosahedron triangle vertices) divided by the number of divisions along each side, and used that to convert to km and miles. Now, this may not sound so bad, and I think it's not too far off for higher resolutions, but it is kinda is bad because, since gnomonic projections are used, there's some distortion from the side to the center of the triangles, so these values are probably under-estimations. If this picks up some traction I'll do some proper estimations.

Estimated hex radius is biased down (better to estimate down than up for encompassing radius). These tables were generated with some code, so if you want to mess around with the values or target a range of values more specifically here it is: [CodeSandbox](https://codesandbox.io/s/hexmap-other-stuff-k7um1?file=/src/index.ts)

Anyway, here are the most notable resolutions, since it's kind of ridiculous how high the resolution values can get.

### kilometers
| resolution | side angle (deg.) | hex radius | estimated hex radius |
| --- | --- | --- | --- |
| 1 | 21.145° | 2353.8488 km | 2350 km |  
| 2 | 10.5725° | 1176.9244 km | 1170 km |  
| 3 | 7.0483° | 784.6163 km | 780 km |  
| 4 | 5.2862° | 588.4622 km | 590 km |  
| 5 | 4.229° | 470.7698 km | 470 km |  
| 6 | 3.5242° | 392.3081 km | 390 km |  
| 7 | 3.0207° | 336.2641 km | 330 km |  
| 8 | 2.6431° | 294.2311 km | 290 km |  
| 9 | 2.3494° | 261.5388 km | 260 km |  
| 10 | 2.1145° | 235.3849 km | 230 km |  
| 11 | 1.9223° | 213.9863 km | 210 km |  
| 12 | 1.7621° | 196.1541 km | 190 km |  
| 13 | 1.6265° | 181.0653 km | 180 km |  
| 14 | 1.5104° | 168.1321 km | 170 km |  
| 15 | 1.4097° | 156.9233 km | 150 km |  
| 17 | 1.2438° | 138.4617 km | 140 km |  
| 18 | 1.1747° | 130.7694 km | 130 km |  
| 19 | 1.1129° | 123.8868 km | 120 km |  
| 21 | 1.0069° | 112.0880 km | 110 km |  
| 23 | 0.9193° | 102.3413 km | 100 km |  
| 25 | 0.8458° | 94.1540 km | 95 km |  
| 26 | 0.8133° | 90.5326 km | 90 km |  
| 28 | 0.7552° | 84.0660 km | 85 km |  
| 29 | 0.7291° | 81.1672 km | 80 km |  
| 31 | 0.6821° | 75.9306 km | 75 km |  
| 34 | 0.6219° | 69.2308 km | 70 km |  
| 36 | 0.5874° | 65.3847 km | 65 km |  
| 39 | 0.5422° | 60.3551 km | 60 km |  
| 43 | 0.4917° | 54.7407 km | 55 km |  
| 47 | 0.4499° | 50.0819 km | 50 km |  
| 52 | 0.4066° | 45.2663 km | 45 km |  
| 59 | 0.3584° | 39.8957 km | 40 km |  
| 67 | 0.3156° | 35.1321 km | 35 km |  
| 78 | 0.2711° | 30.1775 km | 30 km |  
| 94 | 0.2249° | 25.0409 km | 25 km |  
| 118 | 0.1792° | 19.9479 km | 20 km |  
| 157 | 0.1347° | 14.9927 km | 15 km |  
| 235 | 0.09° | 10.0164 km | 10 km |  
| 262 | 0.0807° | 8.9842 km | 9 km |  
| 294 | 0.0719° | 8.0063 km | 8 km |  
| 336 | 0.0629° | 7.0055 km | 7 km |  
| 392 | 0.0539° | 6.0047 km | 6 km |  
| 471 | 0.0449° | 4.9976 km | 5 km |  
| 588 | 0.036° | 4.0031 km | 4 km |  
| 785 | 0.0269° | 2.9985 km | 3 km |  
| 1177 | 0.018° | 1.9999 km | 2 km |  
| 2354 | 0.009° | 0.9999 km | 1 km |  
| 2615 | 0.0081° | 0.9001 km | 0.9 km |  
| 2942 | 0.0072° | 0.8001 km | 0.8 km |  
| 3363 | 0.0063° | 0.6999 km | 0.7 km |  
| 3923 | 0.0054° | 0.6000 km | 0.6 km |  
| 4708 | 0.0045° | 0.5000 km | 0.5 km |  
| 5885 | 0.0036° | 0.4000 km | 0.4 km |  
| 7846 | 0.0027° | 0.3000 km | 0.3 km |  
| 11769 | 0.0018° | 0.2000 km | 0.2 km |
| 23538 | 0.0009° | 0.1000 km | 0.1 km |

### miles
| resolution | side angle (deg.) | hex radius | estimated hex radius |
| --- | --- | --- | --- |
| 1 | 21.145° | 1462.6138 mi | 1460 mi |  
| 2 | 10.5725° | 731.3069 mi | 730 mi |  
| 3 | 7.0483° | 487.5379 mi | 490 mi |  
| 4 | 5.2862° | 365.6535 mi | 360 mi |  
| 5 | 4.229° | 292.5228 mi | 290 mi |  
| 6 | 3.5242° | 243.7690 mi | 240 mi |  
| 7 | 3.0207° | 208.9448 mi | 210 mi |  
| 8 | 2.6431° | 182.8267 mi | 180 mi |  
| 9 | 2.3494° | 162.5126 mi | 160 mi |  
| 10 | 2.1145° | 146.2614 mi | 140 mi |  
| 11 | 1.9223° | 132.9649 mi | 130 mi |  
| 12 | 1.7621° | 121.8845 mi | 120 mi |  
| 13 | 1.6265° | 112.5088 mi | 110 mi |  
| 14 | 1.5104° | 104.4724 mi | 100 mi |  
| 15 | 1.4097° | 97.5076 mi | 95 mi |  
| 16 | 1.3216° | 91.4134 mi | 90 mi |  
| 17 | 1.2438° | 86.0361 mi | 85 mi |  
| 18 | 1.1747° | 81.2563 mi | 80 mi |  
| 19 | 1.1129° | 76.9797 mi | 75 mi |  
| 21 | 1.0069° | 69.6483 mi | 70 mi |  
| 22 | 0.9611° | 66.4824 mi | 65 mi |  
| 24 | 0.881° | 60.9422 mi | 60 mi |  
| 27 | 0.7831° | 54.1709 mi | 55 mi |  
| 29 | 0.7291° | 50.4350 mi | 50 mi |  
| 33 | 0.6408° | 44.3216 mi | 45 mi |  
| 37 | 0.5715° | 39.5301 mi | 40 mi |  
| 42 | 0.5035° | 34.8241 mi | 35 mi |  
| 49 | 0.4315° | 29.8493 mi | 30 mi |  
| 59 | 0.3584° | 24.7901 mi | 25 mi |  
| 73 | 0.2897° | 20.0358 mi | 20 mi |  
| 98 | 0.2158° | 14.9246 mi | 15 mi |  
| 146 | 0.1448° | 10.0179 mi | 10 mi |  
| 163 | 0.1297° | 8.9731 mi | 9 mi |  
| 183 | 0.1155° | 7.9924 mi | 8 mi |  
| 209 | 0.1012° | 6.9982 mi | 7 mi |  
| 244 | 0.0867° | 5.9943 mi | 6 mi |  
| 293 | 0.0722° | 4.9919 mi | 5 mi |  
| 366 | 0.0578° | 3.9962 mi | 4 mi |  
| 488 | 0.0433° | 2.9972 mi | 3 mi |  
| 731 | 0.0289° | 2.0008 mi | 2 mi |  
| 1463 | 0.0145° | 0.9997 mi | 1 mi |  
| 1625 | 0.013° | 0.9001 mi | 0.9 mi |  
| 1828 | 0.0116° | 0.8001 mi | 0.8 mi |  
| 2089 | 0.0101° | 0.7002 mi | 0.7 mi |  
| 2438 | 0.0087° | 0.5999 mi | 0.6 mi |  
| 2925 | 0.0072° | 0.5000 mi | 0.5 mi |  
| 3657 | 0.0058° | 0.3999 mi | 0.4 mi |  
| 4875 | 0.0043° | 0.3000 mi | 0.3 mi |  
| 7313 | 0.0029° | 0.2000 mi | 0.2 mi |
| 14626 | 0.0014° | 0.1000 mi | 0.1 mi |

# how it works

hexmap uses an icosahedron as a base, and generates points with either gnomonic projections or quaternions. These points are split into rows and columns, and since all icosahedron triangles are equilateral, there are some pretty nice relationships between point row and column numbers and whether they're hexagon centers or vertices. Point generation is done by triangles, and those points are numbered according to their location on the map, and respective rows and columns. Once these points are generated, they can be used to either generate a hash (hashes only use hexagon centers, not hexagon vertices), or to generate a hexagon.

Now, all this considered, hexmap has the potential to be a flexible library with more features, I just need to know people will use it to actually work on it, so in the next section I'll explain how you can help out or contact me, and some of the current problems we need to solve.

# how to help

If you want to help out, welcome to the team. Here are some pending features, and below that some of the problems I'm currently trying to solve:

## pending features

- <ins>hexagon navigation:</ins> hexagon navigation requires 2 things: hexagon generation from lazy points, and how to actually navigate. The first one is pretty easy and I could add it in a couple minutes, but how to actually navigate requires some thought, and maybe some input from you, the reader! If enough people request this I'll definitely add it since it would definitely come in handy. --- Maybe instead of navigation we could just add something that generates the hexagons around another one, but either way, it's all up to you guys. Subreddit and contact info at bottom.

## current problems

- <ins>quaternion triangle side percent:</ins> currently, only gnomonic rotation mode can be used for hash generation, since there is a pretty considerable difference between the calculated lazy point range and the point that needs to be hashed. _Pero Porque?_ This is because in order to generate points around another point (since hexmap uses triangles for point generation), hexmap calculates the percent of a point's projection along its sides for each of them. Now, this works for gnomonic projection pretty nicely (vectors, straightforward), but for quaternions I'm thinking it requires quaternion algebra, and that's a whole different beast. If you think you can do this, and want to, send me an email, or look at contact info below and I'll explain it in more detail.

# subreddit and contact info

I think this library has some potential, so I've done created a whole subreddit for it: [r/hexmapz](https://www.reddit.com/r/hexmapz/). There you can request features, and if enough people need it I'll start working on it, or add it above so others can help too.

This might be a bad idea, but my email is [watchouthomes@gmail.com](mailto:watchouthomes@gmail.com), so if you want to talk about hexmap or anything in general just send me an email.
