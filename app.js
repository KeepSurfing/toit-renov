import { imageMarkup } from "./image-markup.js";
(function(){
  "use strict";
  var root=document.documentElement;
  root.classList.add("js");
  var reduce=window.matchMedia("(prefers-reduced-motion:reduce)").matches;

  /* ---------- theme ---------- */
  try{
    var saved=localStorage.getItem("tr-theme");
    if(saved){root.setAttribute("data-theme",saved);}
  }catch(e){}
  document.getElementById("themeBtn").addEventListener("click",function(){
    var cur=root.getAttribute("data-theme");
    var sysDark=window.matchMedia("(prefers-color-scheme:dark)").matches;
    var next = cur ? (cur==="dark"?"light":"dark") : (sysDark?"light":"dark");
    root.setAttribute("data-theme",next);
    try{localStorage.setItem("tr-theme",next);}catch(e){}
  });

  /* ---------- nav scroll state ---------- */
  var nav=document.getElementById("nav");
  var onScroll=function(){ nav.classList.toggle("is-scrolled",window.scrollY>24); };
  onScroll();window.addEventListener("scroll",onScroll,{passive:true});

  /* ---------- mobile menu ---------- */
  var menu=document.getElementById("menu"),tgl=document.getElementById("navToggle");
  var setMenu=function(open){
    menu.classList.toggle("is-open",open);
    tgl.setAttribute("aria-expanded",open?"true":"false");
    document.body.style.overflow=open?"hidden":"";
  };
  tgl.addEventListener("click",function(){setMenu(!menu.classList.contains("is-open"));});
  menu.addEventListener("click",function(e){ if(e.target.tagName==="A") setMenu(false); });

  /* ---------- scroll helper ---------- */
  function scrollToId(id){
    var el=document.getElementById(id); if(!el) return;
    try{ el.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"}); }
    catch(_){ try{ el.scrollIntoView(); }catch(e){} }
  }

  /* ---------- stars ---------- */
  var starSVG='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.9 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/></svg>';
  document.querySelectorAll(".stars").forEach(function(el){ el.innerHTML=starSVG.repeat(5); });

  /* ============================================================
     Photos — chantiers réalisés par Toit-Reno
     (fournies par l'entreprise, optimisées, embarquées en data-URI)
     ============================================================ */
  var IMG={};
  try{ IMG=JSON.parse(document.getElementById("imgdata").textContent); }catch(e){}
  function imgTag(key,alt,eager){ return imageMarkup(IMG,key,alt,eager); }

  /* photos des 6 grandes prestations */
  var FEAT={
    "svc6-01":["3","Faîtage et tuiles de rive lors d'une réfection de couverture"],
    "svc6-02":["2","Toiture en cours de dépose lors d'une intervention"],
    "svc6-03":["7","Charpente mise à nu pendant une rénovation"],
    "svc6-04":["5","Noue en zinc sur une toiture rénovée"],
    "svc6-05":["9","Étanchéité en zinc réalisée au pied d'une cheminée"],
    "svc6-06":["6","Fenêtre de toit et son solin en zinc"]
  };
  Object.keys(FEAT).forEach(function(id){
    var el=document.getElementById(id);
    if(el) el.innerHTML=imgTag(FEAT[id][0],FEAT[id][1]);
  });

  /* photo artisan */
  (function(){
    var a=document.getElementById("artisanMedia");
    if(a) a.innerHTML=imgTag("1","Livraison de matériaux sur un chantier Toit-Reno");
  })();

  /* chiffres — compteurs animés + clic vers la galerie */
  (function(){
    var stats=document.getElementById("stats"); if(!stats) return;
    var nums=[].slice.call(stats.querySelectorAll(".stat-num"));
    function target(el){ return parseInt(el.getAttribute("data-to"),10)||0; }
    function run(el){
      if(el.dataset.done) return; el.dataset.done="1";
      var to=target(el);
      if(reduce){ el.textContent=to; return; }
      var start=Date.now();
      var iv=setInterval(function(){
        var p=Math.min(1,(Date.now()-start)/1400), e=1-Math.pow(1-p,3);
        el.textContent=Math.round(to*e);
        if(p>=1){ el.textContent=to; clearInterval(iv); }
      },33);
    }
    if("IntersectionObserver" in window){
      var io=new IntersectionObserver(function(es){
        es.forEach(function(en){ if(en.isIntersecting){ run(en.target); io.unobserve(en.target); } });
      },{threshold:.35});
      nums.forEach(function(n){ io.observe(n); });
      setTimeout(function(){
        nums.forEach(function(n){ if(n.getBoundingClientRect().top < (window.innerHeight||800)*1.1) run(n); });
      },1500);
    } else { nums.forEach(run); }
    /* backstop : jamais bloqué à 0 */
    setTimeout(function(){ nums.forEach(function(n){ if(n.textContent==="0" && target(n)>0) n.textContent=target(n); }); },4000);
    stats.addEventListener("click",function(e){
      if(e.target.closest(".stat")) scrollToId("realisations");
    });
  })();

  /* prestations → préremplissage du devis */
  (function(){
    var sel=document.getElementById("f-type");
    function go(val){
      if(sel && val){
        var m=[].slice.call(sel.options).filter(function(o){
          return o.text.replace(/\s+/g," ").trim()===val;
        })[0];
        if(m){
          sel.value = m.value || m.text;
          sel.classList.remove("is-flash");
          void sel.offsetWidth;
          sel.classList.add("is-flash");
        }
      }
      scrollToId("devis");
      var nom=document.getElementById("f-nom");
      if(nom) setTimeout(function(){ try{ nom.focus({preventScroll:true}); }catch(_){ } },reduce?0:520);
    }
    function handle(e){
      var el=e.target.closest("[data-devis]");
      if(!el || el.closest("#stats")) return;
      if(e.type==="keydown" && e.key!=="Enter" && e.key!==" ") return;
      e.preventDefault();
      go(el.getAttribute("data-devis"));
    }
    document.addEventListener("click",handle);
    document.addEventListener("keydown",handle);
  })();

  /* comparateur avant / après — pointeur + tactile + clavier + micro-anim d'intro (une fois) */
  (function(){
    var cmp=document.getElementById("cmp"); if(!cmp) return;
    var frame=document.getElementById("cmpFrame"),
        before=document.getElementById("cmpBefore"),
        after=document.getElementById("cmpAfter"),
        handle=document.getElementById("cmpHandle");
    var db=IMG.before1||{}, da=IMG.after1||{};
    before.src=db.uri||""; after.src=da.uri||"";
    before.width=after.width=da.w||660;
    before.height=after.height=da.h||533;

    var pos=50, dragging=false, engaged=false, timers=[];
    function set(p){
      pos=Math.max(0,Math.min(100,p));
      cmp.style.setProperty("--pos",pos+"%");
      var r=Math.round(pos);
      handle.setAttribute("aria-valuenow",r);
      handle.setAttribute("aria-valuetext",r+" % de la toiture rénovée visible");
    }
    set(50);

    /* --- micro-animation d'intro, une seule fois --- */
    var introRan=false;
    function stopIntro(){
      engaged=true;
      timers.forEach(clearTimeout); timers=[];
      cmp.classList.remove("is-anim");
    }
    function playIntro(){
      if(engaged || introRan) return;
      introRan=true;
      cmp.classList.add("is-anim");
      set(58);
      timers.push(setTimeout(function(){ if(!engaged) set(46); }, 660));
      timers.push(setTimeout(function(){ if(!engaged) set(50); }, 1320));
      timers.push(setTimeout(function(){ cmp.classList.remove("is-anim"); }, 2000));
    }
    function maybeIntro(){
      if(introRan || engaged) return;
      var r=frame.getBoundingClientRect(), vh=window.innerHeight||800;
      if(r.top < vh*0.72 && r.bottom > vh*0.3){ playIntro(); detach(); }
    }
    function detach(){ window.removeEventListener("scroll",maybeIntro); }
    if(!reduce){
      if("IntersectionObserver" in window){
        var io=new IntersectionObserver(function(es){
          es.forEach(function(en){ if(en.isIntersecting){ playIntro(); io.disconnect(); } });
        },{threshold:.4});
        io.observe(frame);
      }
      window.addEventListener("scroll",maybeIntro,{passive:true});
      setTimeout(maybeIntro,600);
    }

    /* --- interaction --- */
    function fromX(x){
      var r=frame.getBoundingClientRect();
      if(r.width) set((x-r.left)/r.width*100);
    }
    frame.addEventListener("pointerdown",function(e){
      stopIntro();
      dragging=true; cmp.classList.add("dragging");
      try{ frame.setPointerCapture(e.pointerId); }catch(_){}
      fromX(e.clientX);
      if(e.target!==handle) handle.focus();
    });
    frame.addEventListener("pointermove",function(e){ if(dragging) fromX(e.clientX); });
    function endDrag(){ dragging=false; cmp.classList.remove("dragging"); }
    frame.addEventListener("pointerup",endDrag);
    frame.addEventListener("pointercancel",endDrag);
    handle.addEventListener("keydown",function(e){
      var k=e.key, big=e.shiftKey?12:4, act=true;
      if(k==="ArrowLeft"||k==="ArrowDown") set(pos-big);
      else if(k==="ArrowRight"||k==="ArrowUp") set(pos+big);
      else if(k==="Home") set(0);
      else if(k==="End") set(100);
      else if(k==="PageDown") set(pos-15);
      else if(k==="PageUp") set(pos+15);
      else act=false;
      if(act){ stopIntro(); e.preventDefault(); }
    });
    handle.addEventListener("click",function(e){ e.preventDefault(); });
    window.addEventListener("resize",function(){ set(pos); });
  })();

  /* ---------- gallery ---------- */
  var SHOTS=[
    {k:"2",cat:"toiture",t:"Dépose d'une couverture tuile \u2014 Bordeaux"},
    {k:"3",cat:"toiture",t:"Réfection de faîtage et tuiles de rive"},
    {k:"6",cat:"zinguerie",t:"Fenêtre de toit et solin en zinc"},
    {k:"9",cat:"zinguerie",t:"Étanchéité zinc au pied d'une cheminée"},
    {k:"7",cat:"toiture",t:"Charpente mise à nu \u2014 rénovation"},
    {k:"11",cat:"entretien",t:"Toiture tuile \u2014 repérage avant démoussage"},
    {k:"10",cat:"facade",t:"Immeuble ancien \u2014 échafaudage de toiture"},
    {k:"8",cat:"facade",t:"Maison en pierre \u2014 façade et menuiseries"},
    {k:"1",cat:"toiture",t:"Livraison des matériaux sur le chantier"}
  ];
  var gal=document.getElementById("gallery");
  SHOTS.forEach(function(s,i){
    var d=document.createElement("button");
    d.className="shot";d.type="button";
    d.setAttribute("data-cat",s.cat);d.setAttribute("data-i",i);
    d.setAttribute("aria-label",s.t);
    d.innerHTML=imgTag(s.k,s.t)+'<span class="cap">'+s.t+'</span>';
    gal.appendChild(d);
  });

  /* filters */
  document.getElementById("filters").addEventListener("click",function(e){
    var b=e.target.closest(".filter"); if(!b) return;
    this.querySelectorAll(".filter").forEach(function(f){f.classList.toggle("is-active",f===b);});
    var cat=b.getAttribute("data-cat");
    gal.querySelectorAll(".shot").forEach(function(sh){
      sh.classList.toggle("is-hidden",cat!=="all" && sh.getAttribute("data-cat")!==cat);
    });
  });

  /* ---------- lightbox ---------- */
  var lb=document.createElement("div");
  lb.className="lb";
  lb.innerHTML='<button class="lb-btn lb-close" aria-label="Fermer">&times;</button>'
    +'<div class="lb-stage" id="lbStage"></div>'
    +'<div class="lb-bar"><span id="lbCap"></span><span class="lb-nav">'
    +'<button class="lb-btn" data-d="-1" aria-label="Précédent">&#8592;</button>'
    +'<button class="lb-btn" data-d="1" aria-label="Suivant">&#8594;</button></span></div>';
  document.body.appendChild(lb);
  var lbStage=lb.querySelector("#lbStage"),lbCap=lb.querySelector("#lbCap"),cur=0;
  function openLB(i){
    var vis=SHOTS.map(function(s,idx){return idx;}).filter(function(idx){
      return !gal.querySelector('.shot[data-i="'+idx+'"]').classList.contains("is-hidden");
    });
    cur=i;
    lb.classList.add("is-open");document.body.style.overflow="hidden";
    render();
    lb._vis=vis;
  }
  function render(){
    var s=SHOTS[cur];
    lbStage.innerHTML=imgTag(s.k,s.t);
    lbCap.textContent=s.t;
  }
  function step(d){
    var vis=lb._vis||SHOTS.map(function(_,i){return i;});
    var p=vis.indexOf(cur); p=(p+d+vis.length)%vis.length; cur=vis[p]; render();
  }
  function closeLB(){lb.classList.remove("is-open");document.body.style.overflow="";}
  gal.addEventListener("click",function(e){
    var sh=e.target.closest(".shot"); if(!sh) return;
    openLB(+sh.getAttribute("data-i"));
  });
  lb.addEventListener("click",function(e){
    if(e.target===lb||e.target.classList.contains("lb-close")) return closeLB();
    var b=e.target.closest("[data-d]"); if(b) step(+b.getAttribute("data-d"));
  });
  document.addEventListener("keydown",function(e){
    if(!lb.classList.contains("is-open")) return;
    if(e.key==="Escape") closeLB();
    if(e.key==="ArrowLeft") step(-1);
    if(e.key==="ArrowRight") step(1);
  });

  /* ---------- avis Google (authentiques, fournis par l'entreprise) ---------- */
  var REV=[
    "Un collègue d'expérience avec des prix attractifs, très consciencieux et méticuleux. Je conseille ce couvreur sans hésitation, service rapide et fiable.",
    "Entreprise très sérieuse et carrée. Quelqu'un qui connaît bien son métier et qui fait bien son travail. Je suis très content de vous avoir, merci beaucoup.",
    "Très compétent, excellent rapport avec le client, travail parfait. Je recommande tout particulièrement cet artisan, auquel je ferai appel si besoin.",
    "Très professionnel, un service de qualité et une prestation conforme à ce qui a été proposé.",
    "Travaux d'étanchéité réalisés sur quatre cheminées et solin en zinc, ainsi que la réparation d'une verrière traditionnelle. Au top, je recommande à 100 %.",
    "Couvreur sérieux, entouré d'une équipe ponctuelle et sympathique. À recommander pour tous travaux de toiture."
  ];
  var gMark='<svg class="g" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.2-2 3.7-5 3.7-8.6"/><path fill="#34A853" d="M12 24c3.2 0 5.9-1 7.8-2.9l-3.7-2.9c-1 .7-2.3 1.1-4.1 1.1-3.1 0-5.8-2.1-6.7-5l-3.8 3C3.4 21.3 7.4 24 12 24"/><path fill="#FBBC05" d="M5.3 14.4c-.25-.7-.4-1.5-.4-2.4s.15-1.7.38-2.4l-3.8-3C.4 5.6 0 7.7 0 12s.4 6.4 1.44 8.9z"/><path fill="#EB4335" d="M12 4.8c2.2 0 3.7.95 4.5 1.75l3.3-3.2C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.44 6.6l3.86 3c.9-2.9 3.6-4.8 6.7-4.8"/></svg>';
  /* carousel : défilement continu (CSS) — double jeu de cartes pour boucler sans couture */
  var track=document.getElementById("acTrack");
  function buildReview(txt){
    var d=document.createElement("figure");
    d.className="review";d.style.margin="0";
    d.setAttribute("role","group");
    d.innerHTML='<span class="stars" aria-hidden="true">'+starSVG.repeat(5)+'</span>'
      +'<blockquote style="margin:0"><p>« '+txt+' »</p></blockquote>'
      +'<figcaption>'+gMark+'<span>Avis Google</span></figcaption>';
    return d;
  }
  if(track){
    var setA=document.createElement("div"); setA.className="ac-set";
    var setB=document.createElement("div"); setB.className="ac-set"; setB.setAttribute("aria-hidden","true");
    REV.forEach(function(txt){ setA.appendChild(buildReview(txt)); setB.appendChild(buildReview(txt)); });
    track.appendChild(setA); track.appendChild(setB);
    track.style.animationDuration = Math.round(REV.length * 7.8) + "s";
  }

  /* preuve rapide : 3 meilleurs avis */
  (function(){
    var wrap=document.getElementById("miniReviews"); if(!wrap) return;
    [4,0,2].forEach(function(i){
      var f=document.createElement("figure");
      f.className="mp-card"; f.setAttribute("role","group");
      f.innerHTML='<span class="stars" aria-hidden="true">'+starSVG.repeat(5)+'</span>'
        +'<blockquote><p>\u00ab\u00a0'+REV[i]+'\u00a0\u00bb</p></blockquote>'
        +'<figcaption>'+gMark+'<span>Avis Google</span></figcaption>';
      wrap.appendChild(f);
    });
  })();

  /* ---------- zone : vue d'un chantier bordelais ---------- */
  (function(){
    var zm=document.getElementById("zoneMap");
    if(zm) zm.innerHTML=imgTag("10","Chantier de toiture sur un immeuble ancien du centre de Bordeaux");
  })();

  /* ---------- form ---------- */
  document.getElementById("devisForm").addEventListener("submit",function(e){
    e.preventDefault();
    var ok=true;
    ["f-nom","f-tel"].forEach(function(id){
      var el=document.getElementById(id);
      if(!el.value.trim()){el.style.borderColor="var(--accent)";ok=false;}
      else el.style.borderColor="";
    });
    if(!ok) return;
    document.getElementById("formOk").classList.add("is-on");
    this.querySelector("button[type=submit]").textContent="Demande envoyée ✓";
  });

  /* ---------- year ---------- */
  document.getElementById("year").textContent=new Date().getFullYear();

  /* ---------- reveal on scroll ---------- */
  var revEls=[].slice.call(document.querySelectorAll(".reveal"));
  var showAll=function(){revEls.forEach(function(el){el.classList.add("is-in");});};
  if("IntersectionObserver" in window && !reduce){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){en.target.classList.add("is-in");io.unobserve(en.target);}
      });
    },{rootMargin:"0px 0px -8% 0px"});
    revEls.forEach(function(el,i){
      el.style.transitionDelay=(Math.min(i%4,3)*70)+"ms";
      io.observe(el);
    });
    /* failsafe: never leave content hidden if IO misbehaves */
    var kick=function(){
      var vh=window.innerHeight||800;
      revEls.forEach(function(el){
        if(el.classList.contains("is-in")) return;
        if(el.getBoundingClientRect().top < vh*0.92) el.classList.add("is-in");
      });
    };
    window.addEventListener("load",kick);
    window.addEventListener("scroll",kick,{passive:true});
    setTimeout(kick,300);
    setTimeout(showAll,3000);
  }else{
    showAll();
  }


})();