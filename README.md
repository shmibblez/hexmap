# hexmap
for seeing it in action, check out this sweet link [(CodeSandbox)](https://codesandbox.io/s/hex-map-dev-z0qc0?file=/src/sketch.ts), ps: (if you click on the screen it generates another point and its hash)
## installation
```
npm install hexmap --save
```
## usage
```
import { Icosahedron, point3, Vectors3 } from 'hexmap';

const point = Vectors3.fromCoordinates({ lat: -90, lon: 0 })
const icosahedron = new Icosahedron()
const hash = icosahedron.generateHash({ p: point, res: 74, rotationMethod: 'gnomonic' })
```
and that's pretty much it, for generating hashes at least

Since hexmap is lazy loading, it can be used for a lot more stuff, it just hasn't been implemented yet. Uses include: hexagon navigation, and that's pretty much all I can come up with right now, but don't worry, there are more uses, I've just been overcome by laziness so I'm gonna go ahead and take a nap