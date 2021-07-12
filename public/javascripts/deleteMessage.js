let params = new URLSearchParams(location.search);
params.delete('message');
history.replaceState(null, '', location.href.split('?')[0]);
