'use strict';

const testStr =
`
[tex:  { \\displaystyle
  b_n = \\sum_{m=0}^{N-1} a_m
}\\]\\]
]
`;

let r = /^(?:\[tex:\r?\n((?:\\\]|[\s\S])*?)\])$/m;
console.log(r.exec(testStr));