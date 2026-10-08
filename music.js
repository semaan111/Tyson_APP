'use strict';
(() => {
  const DEFAULT_URL='https://open.spotify.com/track/6ndmKwWqMozN2tcZqzCX4K';
  const $=id=>document.getElementById(id);
  let source=DEFAULT_URL, controller=null, ready=false, fallback=false;
  let playing=false, wanted=true, speaking=false, held=false, manualPause=false;
  let confirmTimer, fallbackTimer, resumeTimer;
  const feedback=$('spotifyFeedback');
  function render(){
    let label='Activar música', status='Spotify · Remember the Name', icon='▶';
    if(fallback){label='Abrir reproductor';status='Controla la música en Spotify';icon='♫';}
    else if(!ready){label='Conectando Spotify';status='Preparando reproductor';icon='♫';}
    else if(speaking){label='Entrenador hablando';status='Música pausada durante la voz';icon='Ⅱ';}
    else if(held){label='Música en pausa';status='Entrenamiento pausado';icon='▶';}
    else if(playing){label='Pausar música';status='Spotify · Reproduciendo';icon='Ⅱ';}
    else if(manualPause){label='Reanudar música';status='Pausada por ti';icon='▶';}
    else{label='Activar música';status='Pulsa para escuchar';icon='▶';}
    $('musicLabel').textContent=label;
    $('musicStatus').textContent=status;
    $('musicIcon').textContent=icon;
    $('musicToggle').setAttribute('aria-label',label);
    $('musicToggle').setAttribute('aria-pressed',String(playing));
  }
  function iframeUrl(url){const u=new URL(url);const match=u.pathname.match(/^\/(?:intl-[a-z]+\/)?(track|album|playlist)\/([A-Za-z0-9]{22})\/?$/);return match ? 'https://open.spotify.com/embed/'+match[1]+'/'+match[2]+'?utm_source=generator' : null;}
  function useFallback(reason){
    if(ready||fallback)return;
    fallback=true;
    const frame=document.createElement('iframe');
    frame.title='Reproductor oficial de Spotify';
    frame.src=iframeUrl(source);
    frame.width='100%';frame.height='152';frame.style.border='0';frame.style.borderRadius='12px';
    frame.loading='lazy';frame.allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    $('spotifyEmbed').replaceChildren(frame);
    feedback.textContent=reason+' Usa el botón de reproducción dentro del reproductor. El control flotante abre estas opciones.';
    render();
  }
  function pause(){clearTimeout(confirmTimer);playing=false;if(ready)try{controller.pause();}catch{}render();}
  function play(){
    if(!ready||!wanted||speaking||held||document.hidden)return;
    try{controller.resume();}catch{feedback.textContent='Pulsa reproducir directamente dentro de Spotify.';}
    clearTimeout(confirmTimer);
    confirmTimer=setTimeout(()=>{if(!playing&&wanted&&!speaking&&!held){feedback.textContent='Spotify puede requerir que pulses reproducir en su reproductor. No es posible forzar el inicio automático.';render();}},3500);
    render();
  }
  window.TysonMusic={
    voiceStart(){clearTimeout(resumeTimer);speaking=true;pause();},
    voiceEnd(){clearTimeout(resumeTimer);resumeTimer=setTimeout(()=>{speaking=false;if(!manualPause)play();render();},300);}
  };
  window.onSpotifyIframeApiReady=API=>{
    if(fallback)return;
    try{API.createController($('spotifyEmbed'),{url:source,width:'100%',height:152},c=>{
      controller=c;
      c.addListener('ready',()=>{clearTimeout(fallbackTimer);ready=true;feedback.textContent='Spotify conectado. Si el navegador bloquea la reproducción automática, pulsa reproducir una vez.';play();render();});
      c.addListener('playback_update',e=>{
        const active=Boolean(e.data && !e.data.isPaused && !e.data.isBuffering);
        playing=active;
        if(active){clearTimeout(confirmTimer);if(speaking||held){pause();return;}}
        render();
      });
    });}catch{useFallback('No se pudo activar el control automático de Spotify.');}
  };
  $('musicToggle').onclick=()=>{
    if(fallback||!ready){if(!$('musicSheet').open)$('musicSheet').showModal();return;}
    if(playing){manualPause=true;wanted=false;pause();}
    else{manualPause=false;wanted=true;held=false;play();}
    render();
  };
  $('loadSpotify').onclick=()=>{
    const value=$('spotifyUrl').value.trim();let canonical;
    try{const url=new URL(value);if(url.protocol!=='https:'||url.hostname!=='open.spotify.com')throw Error();canonical=url.origin+url.pathname;if(!iframeUrl(canonical))throw Error();}
    catch{feedback.textContent='Pega un enlace válido de canción, álbum o playlist de Spotify.';return;}
    source=canonical;$('spotifyExternal').href=source;manualPause=true;wanted=false;
    if(ready){pause();try{controller.loadEntity(source);}catch{feedback.textContent='No se pudo cambiar la canción. Ábrela directamente en Spotify.';return;}}
    else if(fallback){const frame=$('spotifyEmbed').querySelector('iframe');if(frame)frame.src=iframeUrl(source);}
    feedback.textContent='Contenido cargado. Pulsa reproducir dentro de Spotify o utiliza el botón flotante cuando esté conectado.';
    render();
  };
  $('start').addEventListener('click',()=>{if(clock.state==='paused'){held=true;pause();}else{held=false;if(!manualPause)play();}});
  $('stop').addEventListener('click',()=>{held=true;pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){held=true;pause();}});
  const observer=new MutationObserver(()=>{const state=document.body.dataset.state;if(['paused','done'].includes(state)){held=true;pause();}else if(['work','prepare','rest'].includes(state)){held=false;if(!manualPause)play();}});
  observer.observe(document.body,{attributes:true,attributeFilter:['data-state']});
  fallbackTimer=setTimeout(()=>{if(!ready)useFallback('Spotify no respondió al control automático.');},10000);
  render();
})();
