export default function Charte() {
  return (
    <div className="page texte">
      <h1 className="titre-section">Charte du bon observateur</h1>
      <ol className="charte">
        <li><strong>Observer à distance.</strong> Utilisez des jumelles ; si l’oiseau change de comportement, vous êtes trop près.</li>
        <li><strong>Ne jamais déranger les nids.</strong> Ne vous approchez pas d’un nid et ne touchez ni les œufs ni les jeunes. Un oisillon au sol est souvent surveillé par ses parents.</li>
        <li><strong>Pas de repasse en période de nidification.</strong> Diffuser un chant enregistré pour attirer un oiseau le stresse et le détourne de ses petits.</li>
        <li><strong>Nourrir avec discernement.</strong> Seulement en hiver, avec des graines adaptées (jamais de pain), et en nettoyant les mangeoires.</li>
        <li><strong>Protéger les espèces sensibles.</strong> Ne publiez jamais la localisation précise d’un nid ou d’une espèce rare.</li>
        <li><strong>Respecter les lieux.</strong> Restez sur les sentiers, respectez les réserves, les propriétés privées et les périodes de fermeture.</li>
        <li><strong>Identifier avec prudence.</strong> En cas de doute, comparez avec les espèces ressemblantes avant de valider une observation.</li>
      </ol>
      <h2>Bon à savoir</h2>
      <p>
        La plupart des oiseaux sauvages sont protégés en France (arrêté du 29 octobre 2009) : il est interdit de les capturer, de les
        détenir, de les perturber intentionnellement, ou de détruire leurs nids et leurs œufs.
      </p>
      <p>
        Vous avez trouvé un oiseau blessé ? Contactez un centre de soins pour la faune sauvage (liste sur le site de la LPO) avant d’intervenir.
      </p>
      <h2>Crédits</h2>
      <p className="petit">
        Photos : Wikimedia Commons (auteurs et licences crédités sur chaque fiche). Contours administratifs : france-geojson
        (IGN / INSEE, Licence Ouverte). Contenus des fiches rédigés à partir de l’INPN, de la LPO et de la Liste rouge UICN France.
      </p>
    </div>
  );
}
