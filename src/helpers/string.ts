export function slugify(input: string) {
  input = input.replace(/^\s+|\s+$/g, '');
  input = input.toLowerCase();

  const charset = {
    from: 'ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆĞÍÌÎÏİŇÑÓÖÒÔÕØŘŔŠŞŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇğíìîïıňñóöòôõøðřŕšşťúůüùûýÿžþÞĐđßÆa·/_,:;',
    to: 'AAAAAACCCDEEEEEEEEGIIIIINNOOOOOORRSSTUUUUUYYZaaaaaacccdeeeeeeeegiiiiinnooooooorrsstuuuuuyyzbBDdBAa------',
  };

  for (let i = 0, l = charset.from.length; i < l; i++) {
    input = input.replace(
      new RegExp(charset.from.charAt(i), 'g'),
      charset.to.charAt(i),
    );
  }

  input = input
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return input;
}

export function capitalize(input: string) {
  return input.charAt(0).toUpperCase() + input.slice(1);
}

export function reverse(input: string): any {
  return input.split('').reverse().join('');
}
