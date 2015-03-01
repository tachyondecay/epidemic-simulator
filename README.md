# Epidemic Simulator

A JavaScript-based simulator that models an epidemic in a village under very simple parameters.

Created by [Ben Babcock](http://tachyondecay.net/) as an investigative activity or homework assignment.

[**Try it out here.**](http://tachyondecay.github.io/epidemic-simulator/)

![Screenshot of the epidemic simulator's control panel and canvas grid.](https://raw.githubusercontent.com/tachyondecay/epidemic-simulator/gh-pages/images/demo.png)

Students can conduct a number of trials with the same settings, then adjust a variable and make a hypothesis about how their change will affect the epidemic. If students are familiar with mean and standard deviation, they can use these statistics to support their reasoning. Even if they aren't, they will still be able to develop an understanding of the effects of each variable as they play with the simulator.

## Inspiration

I wanted to use the [Epidemic Modelling activity](http://nrich.maths.org/4489/) on the NRICH website as part of a lesson on experimental probability. I love NRICH, and this activity was just what I needed.

As cool as it wasy, however, it was made in Flash. You can't zoom or resize anything, and forget about using it on modern mobile devices. I could use it, sure, but I thought I might be able to make something even better that didn't rely on Flash.

JavaScript is not my ordinary jam. I'm more of a Python/PHP backend kind of person—but I wanted something that would run in the browser and could be packaged up and hosted anywhere. This was a great opportunity for me to learn a little more about using JavaScript. Learning how to manipulate the `canvas` element with [jCanvas](http://calebevans.me/projects/jcanvas/) was even easier than I thought it would be.

## Browser Support

Developed and extensively tested in Google Chrome 40+ and Firefox 34+.

Because I am using the `canvas` element and jQuery 2.x, **Internet Explorer 8 is not supported.** IE 9 works but isn't pretty (because I'm using [Flexbox](http://css-tricks.com/snippets/css/a-guide-to-flexbox/)). IE 10 is passable, and IE 11 should be all right.

If you're in a school setting and working on computers older than most of the teachers in the building, don't worry: just get your students to use their phones. The simulator *is* mobile-friendly, so a decent Android device or iPhone should do the trick.

## Uncopyrighted

I'm putting this in the public domain so you can hack on it any way you please. Note that the jQuery and jCanvas libraries are under the MIT License, however; you must keep their copyright notices intact.