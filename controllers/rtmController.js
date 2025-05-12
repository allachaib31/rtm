const { status: httpStatus } = require("http-status");
const Database = require('../config/database');

class RtmController {
  static async getData(req, res) {
    const { startDate, endDate, typeOfData, etablissementId, ClientInactive } = req.query;
    const user = req.user;
    console.log(etablissementId)
    console.log("typeOfData", typeOfData)
    try {
      console.log(user.permission)
      if(!user.permission[typeOfData]) {
        return res.status(httpStatus.FORBIDDEN).send({ msg: "You dont have permission" });
      }
      let dateFilter = '';
      if (startDate && endDate) {
        dateFilter = ` AND c.date BETWEEN '${startDate}' AND '${endDate}'`;
      }
      let query, query2 = false, query3 = false;
      if (typeOfData == "Journal") {
        query = `
          SELECT 
    V.fkEtablissement,
    cl.id_client AS fkClient,
    cl.Nom AS clientName,
    -- Vente Info
    v.date,
    v.totalTTC,
    -- Produit Info
    p.nom_produit,
    dv.prix_unitaire,
    dv.quantite,
    dv.prix_unitaire * dv.quantite AS CA,
    p.clissage,

    -- Family Info
    sf.nom AS nomSousFamille,
    f.Nom_famille AS nomFamille

FROM 
    [TrizDistributionMekahli].[dbo].[vente] v

LEFT JOIN [TrizDistributionMekahli].[dbo].[client] cl ON v.fk_client = cl.id_client
LEFT JOIN [TrizDistributionMekahli].[dbo].[detail_vente] dv ON v.id_vente = dv.fk_vente
LEFT JOIN [TrizDistributionMekahli].[dbo].[produit] p ON dv.fk_produit = p.id_produit
LEFT JOIN [TrizDistributionMekahli].[dbo].[Sous_famille] sf ON p.fk_Sousfamille = sf.id_sousfamille
LEFT JOIN [TrizDistributionMekahli].[dbo].[famille] f ON sf.fk_famille = f.id_famille
WHERE 
    (v.fkEtablissement = '31002' OR v.fkEtablissement = '31003' OR v.fkEtablissement = '31001' OR v.fkEtablissement = '31009')
    AND v.date BETWEEN '${startDate}' AND '${endDate}'

ORDER BY 
    v.id_vente;
        `
        query2 = `
          SELECT 
    l.fkEtablissement AS fkEtablissement,

    cl.id_client AS fkClient,
    cl.Nom AS clientName,

    l.date,
    l.total,
    
    p.nom_produit,
    dl.prix_unitaire,
    dl.quantite,
    dl.prix_unitaire * dl.quantite AS CA,

    p.clissage,

    -- Family Info
    sf.nom AS nomSousFamille,
    f.Nom_famille AS nomFamille

FROM 
    [TrizDistributionMekahli].[dbo].[Livraison] l

LEFT JOIN [TrizDistributionMekahli].[dbo].[client] cl ON l.fk_client = cl.id_client

LEFT JOIN [TrizDistributionMekahli].[dbo].[DetailLivraison] dl ON l.id = dl.fk_livraison
LEFT JOIN [TrizDistributionMekahli].[dbo].[produit] p ON dl.fk_produit = p.id_produit
LEFT JOIN [TrizDistributionMekahli].[dbo].[Sous_famille] sf ON p.fk_Sousfamille = sf.id_sousfamille
LEFT JOIN [TrizDistributionMekahli].[dbo].[famille] f ON sf.fk_famille = f.id_famille
WHERE 
    l.fkEtablissement = '31010'
    AND l.date BETWEEN '${startDate}' AND '${endDate}'
ORDER BY 
    l.id;
        `
      }
      else if (typeOfData == "CashVan") {
        query = `
                SELECT 
    v.id_vente,
    v.fk_vendeur,
    v.fk_camion AS fkCamion,
    ca.code_camion,
    -- Client Info
    cl.id_client AS fkClient,
    cl.Nom AS clientName,
    com.nomCommune,
    wil.nomWiaya,
    
    -- Vente Info
    v.date,
    v.heur,
    v.total,
    v.totalAchat,
    v.totalTTC,
    v.remise,
    --v.remise / COUNT(dv.fk_produit) OVER (PARTITION BY v.id_vente) AS remiseProduit,
        COALESCE(
  v.remise 
    / NULLIF(
        COUNT(*) OVER (PARTITION BY v.id_vente)
      , 0)
, 0) AS remiseProduit,
    v.tauxRemise,
    v.fkTournee,
    v.fk_type_client,
    v.fkRemiseGlobal,
    v.TotalPoid,

    -- GPS and Time Info
    v.Position_gps_latitude,
    v.Position_gps_longitude,

    -- Produit Info
    dv.fk_produit,
    p.nom_produit,
    tc.type_client AS typePrix,
    dv.prix_unitaire,
    dv.quantite,
    dv.prix_unitaire * dv.quantite AS CA,
    p.prixReference,
    dv.remise AS remiseDetail,
    dv.valeurRemise,
    dv.prix_changer,
    dv.prixAchat,
    dv.prix_chargementCommercial,
    p.clissage,

    -- Family Info
    sf.nom AS nomSousFamille,
    f.Nom_famille AS nomFamille

FROM 
    [TrizDistributionMekahli].[dbo].[vente] v

LEFT JOIN [TrizDistributionMekahli].[dbo].[client] cl ON v.fk_client = cl.id_client
LEFT JOIN [TrizDistributionMekahli].[dbo].[camion] ca ON v.fk_camion = ca.id_camion
LEFT JOIN [TrizDistributionMekahli].[dbo].[detail_vente] dv ON v.id_vente = dv.fk_vente
LEFT JOIN [TrizDistributionMekahli].[dbo].[produit] p ON dv.fk_produit = p.id_produit
LEFT JOIN [TrizDistributionMekahli].[dbo].[Sous_famille] sf ON p.fk_Sousfamille = sf.id_sousfamille
LEFT JOIN [TrizDistributionMekahli].[dbo].[famille] f ON sf.fk_famille = f.id_famille
LEFT JOIN [TrizDistributionMekahli].[dbo].[Commune] com ON cl.fkCommune = com.codeCommune
LEFT JOIN [TrizDistributionMekahli].[dbo].[Wilaya] wil ON com.fkWilaya = wil.codeWilaya
LEFT JOIN [TrizDistributionMekahli].[dbo].[type_client] tc ON cl.fk_type_client = tc.id_type
LEFT JOIN [TrizDistributionMekahli].[dbo].[versement] vers ON v.fkVersement = vers.id_versement

WHERE 
    v.fkEtablissement = '${etablissementId}'
    AND v.date BETWEEN '${startDate}' AND '${endDate}'

ORDER BY 
    v.id_vente;

                `
      }
      else if (typeOfData == "Commande") {
        query = `
                SELECT 
            c.id,
            c.fkEtablissement,
            e.nomEtablissement,
            ca.code_camion,
            cl.id_client AS fkClient,
            cl.Nom,
            com.nomCommune,
            c.date,
            c.heur,
            c.total,
            c.remise AS remise,
            c.statusConfirmation,
            c.fkVersement,
            c.fkStatutCommande,
            c.dateLivraison,
            c.validation,
            c.fkTypeCommande,
            c.fk_camionLivraison,
            c.ValiderPar,
            c.tauxRemise,
            c.remiseProduit,
            c.fkCategorieCommande,
            dc.fk_produit,
            p.nom_produit,
            p.prixReference,
            p.clissage,
            dc.prix_unitaire,
            dc.quantite,
            dc.prix_unitaire * dc.quantite AS CA,
            c.remise AS RemiseP,
            dc.valeurRemise,
            dc.isfree,
            dc.prix_changer,
            dc.isRemiseComposer,
            dc.fkpack,
            tc.type_client AS TypePrix,
            sf.nom AS nomSousFamille,
            f.Nom_famille,
            c.Position_gps_latitude,
            c.Position_gps_longitude
        FROM 
            "TrizDistributionMekahli"."dbo".Commande c
        JOIN 
            "TrizDistributionMekahli"."dbo".client cl ON c.fkClient = cl.id_client
        JOIN 
            "TrizDistributionMekahli"."dbo".camion ca ON c.fkCamion = ca.id_camion
        JOIN 
            "TrizDistributionMekahli"."dbo".Etablissement e ON e.id = c.fkEtablissement
        JOIN 
            "TrizDistributionMekahli"."dbo".Commune com ON com.codeCommune = cl.Fkcommune
        JOIN 
            "TrizDistributionMekahli"."dbo".DetailCommande dc ON c.id = dc.fk_commande
        JOIN 
            "TrizDistributionMekahli"."dbo".produit p ON dc.fk_produit = p.id_produit
        LEFT JOIN 
            "TrizDistributionMekahli"."dbo".type_client tc ON cl.fk_type_client = tc.id_type
        LEFT JOIN 
            "TrizDistributionMekahli"."dbo".Sous_famille sf ON p.fk_Sousfamille = sf.id_sousfamille
        LEFT JOIN 
            "TrizDistributionMekahli"."dbo".famille f ON sf.fk_famille = f.id_famille
        WHERE 
            c.fkEtablissement = '${etablissementId}' 
            AND c.date BETWEEN '${startDate}' AND '${endDate}'
        ORDER BY 
            c.id, dc.fk_produit;
        
                `;
      } else if (typeOfData == "Livraison") {
        query = `
          SELECT 
    l.id,
    l.fkCommande,
    l.fkEtablissement AS fkEtablissement,
    ca.code_camion AS fkCamion,

    -- Client Info
    cl.id_client AS fkClient,
    cl.Nom AS clientName,
    com.nomCommune,
    wil.nomWiaya,

    l.date,
    l.heur,
    l.total,
    l.totalAchat,
    v.montant,
    l.fkStatutLivraison,
    l.fkRaisonNonLivraison,
    l.statusConfirmation,
    l.dateProgrammer,
    l.fkVisite,
    co.totalPoid AS Poid,

    -- Rotation
    rlc.numero AS rotationNumero,

    -- Product Info from DetailLivraison
    dl.fk_produit,
    p.nom_produit,
    tc.type_client AS typePrix,
    dl.prix_unitaire,
    dl.quantite,
    dl.prix_unitaire * dl.quantite AS CA,
    p.prixReference,
    l.remise, 
    l.remiseProduit,
    dl.valeurRemise,
    dl.prix_changer,
    dl.prixAchat,
    dl.prix_chargementCommercial,
    p.clissage,

    -- Family Info
    sf.nom AS nomSousFamille,
    f.Nom_famille AS nomFamille,

    l.Position_gps_latitude,
    l.Position_gps_longitude

FROM 
    [TrizDistributionMekahli].[dbo].[Livraison] l

LEFT JOIN [TrizDistributionMekahli].[dbo].[client] cl ON l.fk_client = cl.id_client
LEFT JOIN [TrizDistributionMekahli].[dbo].[camion] ca ON l.fk_camion = ca.id_camion
LEFT JOIN [TrizDistributionMekahli].[dbo].[Commande] co ON l.fkCommande = co.id
LEFT JOIN [TrizDistributionMekahli].[dbo].[DetailLivraison] dl ON l.id = dl.fk_livraison
LEFT JOIN [TrizDistributionMekahli].[dbo].[produit] p ON dl.fk_produit = p.id_produit
LEFT JOIN [TrizDistributionMekahli].[dbo].[Sous_famille] sf ON p.fk_Sousfamille = sf.id_sousfamille
LEFT JOIN [TrizDistributionMekahli].[dbo].[famille] f ON sf.fk_famille = f.id_famille
LEFT JOIN [TrizDistributionMekahli].[dbo].[RotationLivraisonCamion] rlc ON l.fkRotationLivraisonCamion = rlc.id
LEFT JOIN [TrizDistributionMekahli].[dbo].[Commune] com ON cl.fkCommune = com.codeCommune
LEFT JOIN [TrizDistributionMekahli].[dbo].[Wilaya] wil ON com.fkWilaya = wil.codeWilaya
LEFT JOIN [TrizDistributionMekahli].[dbo].[type_client] tc ON cl.fk_type_client = tc.id_type
LEFT JOIN [TrizDistributionMekahli].[dbo].[versement] v ON l.fk_versement = v.id_versement
WHERE 
    l.fkEtablissement = '${etablissementId}'
    AND l.date BETWEEN '${startDate}' AND '${endDate}'
ORDER BY 
    l.id;
    `
      } else if (typeOfData == "Credit") {
        if (etablissementId == "31010") {
          query = `
WITH SecteurCamionCTE AS (
    SELECT 
        sec.fk_client,
        sec.fk_secteur,
        cas.fk_camion,
        cam.code_camion,
        ROW_NUMBER() OVER (
            PARTITION BY sec.fk_client 
            ORDER BY 
                CASE WHEN cam.id_camion IS NOT NULL THEN 0 ELSE 1 END,
                sec.id DESC
        ) AS rn
    FROM TrizDistributionMekahli.dbo.secteur_client sec
    LEFT JOIN TrizDistributionMekahli.dbo.camion_secteur cas 
        ON cas.fk_secteur = sec.fk_secteur
    LEFT JOIN TrizDistributionMekahli.dbo.camion cam 
        ON cam.id_camion = cas.fk_camion
)

SELECT  
    sce.fkClient,
    sce.fkEtablissement,
    sce.sold,
    c.raison_social,
    scct.code_camion AS [Camion Name]
FROM TrizStockMekahli.dbo.stock_client_Etablissement sce
LEFT JOIN TrizStockMekahli.dbo.stock_client c 
    ON c.id = sce.fkClient
LEFT JOIN TrizDistributionMekahli.dbo.client sc 
    ON sc.id_client = c.id
LEFT JOIN SecteurCamionCTE scct 
    ON scct.fk_client = sc.id_client AND scct.rn = 1
WHERE sce.sold <> 0 
  AND sce.fkEtablissement = 31010;


  `
        } else {
          query = `
SELECT cc.[id]
      ,cc.[fk_camion]
      ,ca.code_camion as [Camion Name]
      ,cc.[fk_client] as fkClient
      ,cl.Nom as [Client Name]
      ,cc.[solde]
      ,cc.[fkEtablissement]
      ,cc.[isSynchroniser]
      ,cc.[isLitigeCredit]
  FROM [TrizDistributionMekahli].[dbo].[CreditCamionClient] cc
  LEFT JOIN [TrizDistributionMekahli].[dbo].[client] cl
    ON cl.id_client = cc.fk_client
  LEFT JOIN [TrizDistributionMekahli].[dbo].[camion] ca
    ON ca.id_camion = cc.fk_camion
   WHERE cc.fkEtablissement = '${etablissementId}' OR (cl.fkEtablissement = '${etablissementId}' OR ca.fkEtablissement = '${etablissementId}')

                    
                        `
        }
      } else if (typeOfData == "SoldDetails") {
        if (etablissementId == "31010") {
          query = `
                     WITH
-- 1) Count trucks per client
ClientTruckCounts AS (
  SELECT 
    fk_client,
    COUNT(DISTINCT fk_camion) AS camion_count
  FROM [TrizDistributionMekahli].[dbo].[versement]
  WHERE fkEtablissement = '31010'
    AND [date] BETWEEN '${startDate}' AND '${endDate}'
  GROUP BY fk_client
),

-- 2) Total invoiced (vente + livraison) by client/établissement
Sales AS (
  SELECT
    fk_client,
    fkEtablissement,
    SUM(total) AS totalSales
  FROM (
    -- ventes « classiques »
    SELECT fk_client, fkEtablissement, total
    FROM [TrizDistributionMekahli].[dbo].[vente]
    WHERE fkEtablissement = '31010'
      AND [date] BETWEEN '${startDate}' AND '${endDate}'

    UNION ALL

    -- livraisons liées aux versements
    SELECT v.fk_client, l.fkEtablissement, l.total
    FROM [TrizDistributionMekahli].[dbo].[livraison] l
    JOIN [TrizDistributionMekahli].[dbo].[versement] v
      ON l.fk_versement = v.id_versement
    WHERE l.fkEtablissement = '31010'
      AND l.[date] BETWEEN '${startDate}' AND '${endDate}'
  ) AS U
  GROUP BY fk_client, fkEtablissement
),

-- 3) Total paid (versements) by client/établissement
Payments AS (
  SELECT 
    fk_client,
    fkEtablissement,
    SUM(montant) AS totalPayments
  FROM [TrizDistributionMekahli].[dbo].[versement]
  WHERE fkEtablissement = '31010'
    AND [date] BETWEEN '${startDate}' AND '${endDate}'
  GROUP BY fk_client, fkEtablissement
),

-- 4) Balance per client/établissement
Balances AS (
  SELECT
    COALESCE(s.fk_client, p.fk_client)        AS fk_client,
    COALESCE(s.fkEtablissement, p.fkEtablissement) AS fkEtablissement,
    COALESCE(s.totalSales,   0)               AS totalSales,
    COALESCE(p.totalPayments,0)               AS totalPayments,
    COALESCE(s.totalSales,   0)
      - COALESCE(p.totalPayments,0)           AS montantRestant
  FROM Sales  s
  FULL JOIN Payments p 
    ON s.fk_client       = p.fk_client
   AND s.fkEtablissement = p.fkEtablissement
),

-- 5) Mapping versement → montantVente via fkVente ou via livraison
DeliveriesInvoice AS (
  SELECT 
    fk_versement,
    total AS livraisonTotal
  FROM [TrizDistributionMekahli].[dbo].[livraison]
  WHERE fkEtablissement = '31010'
    AND [date] BETWEEN '${startDate}' AND '${endDate}'
)

SELECT DISTINCT
    v.id_versement,
    v.fk_client,
    cl.raison_social            AS clientName,
    v.fk_camion,
    ca.code_camion    AS codeCamion,
    ctc.camion_count,
    CASE WHEN ctc.camion_count > 1 THEN 'Yes' ELSE 'No' END AS multipleCamions,
    v.fkEtablissement,
    v.fk_vendeur,
    v.[date],

    -- ce que le client vient de verser
    v.montant         AS montantVersement,

    -- montant de la vente, pris dans vente.total ou livraison.total
    COALESCE(vt.total, di.livraisonTotal) AS montantVente,

    -- totaux client‑wide
    b.totalSales,
    b.totalPayments,
    b.montantRestant,
    ce.sold,

    v.heur,
    v.typeVersement,
    v.fkVente

FROM [TrizDistributionMekahli].[dbo].[versement] v

LEFT JOIN [TrizStockMekahli].[dbo].[stock_client]              cl 
  ON v.fk_client = cl.id

LEFT JOIN [TrizStockMekahli].[dbo].[stock_client_Etablissement] ce 
  ON cl.id = ce.fkClient 
 AND ce.fkEtablissement = '31010'

LEFT JOIN [TrizDistributionMekahli].[dbo].[camion]              ca 
  ON v.fk_camion  = ca.id_camion

LEFT JOIN ClientTruckCounts                                  ctc 
  ON v.fk_client = ctc.fk_client

LEFT JOIN [TrizDistributionMekahli].[dbo].[vente]             vt 
  ON v.fkVente   = vt.id_vente

LEFT JOIN DeliveriesInvoice                                  di 
  ON v.id_versement = di.fk_versement

LEFT JOIN Balances                                          b  
  ON v.fk_client       = b.fk_client 
 AND v.fkEtablissement = b.fkEtablissement

WHERE 
  v.fkEtablissement = '31010'
  AND v.[date] BETWEEN '${startDate}' AND '${endDate}'

ORDER BY v.[date];
`
          query2 = `
                                         WITH
-- 1) Count trucks per client
ClientTruckCounts AS (
  SELECT 
    fk_client,
    COUNT(DISTINCT fk_camion) AS camion_count
  FROM [TrizStockMekahli].[dbo].[stock_versement]
  WHERE fk_etablissement = '31010'
    AND [date] BETWEEN '${startDate}' AND '${endDate}'
  GROUP BY fk_client
),

-- 2) Total invoiced (vente + livraison) by client/établissement
Sales AS (
  SELECT
    fk_client,
    fkEtablissement,
    SUM(total) AS totalSales
  FROM (
    -- ventes « classiques »
    SELECT fk_client, fkEtablissement, total
    FROM [TrizStockMekahli].[dbo].[stock_vente]
    WHERE fkEtablissement = '31010'
      AND [date] BETWEEN '${startDate}' AND '${endDate}'

    UNION ALL

    -- livraisons liées aux versements
    SELECT v.fk_client, l.fkEtablissement, l.total
    FROM [TrizStockMekahli].[dbo].[stock_livraison] l
    JOIN [TrizStockMekahli].[dbo].[stock_versement] v
      ON l.fk_versementClient = v.id
    WHERE l.fkEtablissement = '31010'
      AND l.[date] BETWEEN '${startDate}' AND '${endDate}'
  ) AS U
  GROUP BY fk_client, fkEtablissement
),

-- 3) Total paid (versements) by client/établissement
Payments AS (
  SELECT 
    fk_client,
    fk_etablissement,
    SUM(montant) AS totalPayments
  FROM [TrizStockMekahli].[dbo].[stock_versement]
  WHERE fk_etablissement = '31010'
    AND [date] BETWEEN '${startDate}' AND '${endDate}'
  GROUP BY fk_client, fk_etablissement
),

-- 4) Balance per client/établissement
Balances AS (
  SELECT
    COALESCE(s.fk_client, p.fk_client)        AS fk_client,
    COALESCE(s.fkEtablissement, p.fk_etablissement) AS fkEtablissement,
    COALESCE(s.totalSales,   0)               AS totalSales,
    COALESCE(p.totalPayments,0)               AS totalPayments,
    COALESCE(s.totalSales,   0)
      - COALESCE(p.totalPayments,0)           AS montantRestant
  FROM Sales  s
  FULL JOIN Payments p 
    ON s.fk_client       = p.fk_client
   AND s.fkEtablissement = p.fk_etablissement
),

-- 5) Mapping versement → montantVente via fkVente ou via livraison
DeliveriesInvoice AS (
  SELECT 
    fk_versementClient,
    total AS livraisonTotal
  FROM [TrizStockMekahli].[dbo].[stock_livraison]
  WHERE fkEtablissement = '31010'
    AND [date] BETWEEN '${startDate}' AND '${endDate}'
)

SELECT DISTINCT
    v.id as id_versement,
    v.fk_client,
    cl.raison_social            AS clientName,
    v.fk_camion,
    ca.code_camion    AS codeCamion,
    ctc.camion_count,
    CASE WHEN ctc.camion_count > 1 THEN 'Yes' ELSE 'No' END AS multipleCamions,
    v.fk_etablissement,
    v.fk_vendeur,
    v.[date],

    -- ce que le client vient de verser
    v.montant         AS montantVersement,

    -- montant de la vente, pris dans vente.total ou livraison.total
    vt.total as montantVente,--COALESCE(vt.total, di.livraisonTotal) AS montantVente,

    -- totaux client‑wide
    b.totalSales,
    b.totalPayments,
    b.montantRestant,
    ce.sold,

    v.heur,
    v.fk_type_etree_sortie,
    vt.id

FROM [TrizStockMekahli].[dbo].[stock_versement] v

LEFT JOIN [TrizStockMekahli].[dbo].[stock_client]              cl 
  ON v.fk_client = cl.id

LEFT JOIN [TrizStockMekahli].[dbo].[stock_client_Etablissement] ce 
  ON cl.id = ce.fkClient 
 AND ce.fkEtablissement = '31010'

LEFT JOIN [TrizDistributionMekahli].[dbo].[camion]              ca 
  ON v.fk_camion  = ca.id_camion

LEFT JOIN ClientTruckCounts                                  ctc 
  ON v.fk_client = ctc.fk_client

LEFT JOIN [TrizStockMekahli].[dbo].[stock_vente]             vt 
  ON v.id   = vt.fk_versement

LEFT JOIN DeliveriesInvoice                                  di 
  ON v.id = di.fk_versementClient

LEFT JOIN Balances                                          b  
  ON v.fk_client       = b.fk_client 
 AND v.fk_etablissement = b.fkEtablissement

WHERE 
  v.fk_etablissement = '31010'
  AND v.[date] BETWEEN '${startDate}' AND '${endDate}'

ORDER BY v.[date];
                    `
          query3 = `
          SELECT 
  fk_client,
  fkEtablissement,
  total as montantVente,
  date
FROM [TrizStockMekahli].[dbo].[stock_vente]
WHERE fkEtablissement = '31010'
  AND [date] BETWEEN '${startDate}' AND '${endDate}'
  AND fk_versement IS NULL;
  `
        }
        else {
          query = `
       WITH
-- 1) Count trucks per client (if still needed)
ClientTruckCounts AS (
  SELECT 
    fk_client,
    COUNT(DISTINCT fk_camion) AS camion_count
  FROM [TrizDistributionMekahli].[dbo].[versement]
  WHERE fkEtablissement = '${etablissementId}' AND [date] BETWEEN '${startDate}' AND '${endDate}'
  GROUP BY fk_client
),

-- 2) Total invoiced (ventes) by client / etablissement
Sales AS (
  SELECT
    fk_client,
    fkEtablissement,
    SUM(total) AS totalSales
  FROM [TrizDistributionMekahli].[dbo].[vente]
  WHERE fkEtablissement = '${etablissementId}' AND [date] BETWEEN '${startDate}' AND '${endDate}'
  GROUP BY fk_client, fkEtablissement
),

-- 3) Total paid (versements) by client / etablissement
Payments AS (
  SELECT 
    fk_client,
    fkEtablissement,
    SUM(montant) AS totalPayments
  FROM [TrizDistributionMekahli].[dbo].[versement]
  WHERE fkEtablissement = '${etablissementId}' AND [date] BETWEEN '${startDate}' AND '${endDate}'
  GROUP BY fk_client, fkEtablissement
),

-- 4) Compute the balance for each client / etablissement
Balances AS (
  SELECT
    s.fk_client,
    s.fkEtablissement,
    COALESCE(s.totalSales,   0) AS totalSales,
    COALESCE(p.totalPayments,0) AS totalPayments,
    COALESCE(s.totalSales,   0)
      - COALESCE(p.totalPayments,0) AS montantRestant
  FROM Sales  s
  FULL JOIN Payments p 
    ON s.fk_client      = p.fk_client
   AND s.fkEtablissement = p.fkEtablissement
)

SELECT
DISTINCT
    v.id_versement,
    v.fk_client,
    cl.Nom            AS clientName,
    v.fk_camion,
    ca.code_camion    AS codeCamion,
    ctc.camion_count,
    CASE WHEN ctc.camion_count > 1 THEN 'Yes' ELSE 'No' END AS multipleCamions,
    v.fkEtablissement,
    v.fk_vendeur,
    v.[date],

    -- what the client just paid
    v.montant         AS montantVersement,

    -- sale total (may be NULL if fkVente is missing)
    vt.total          AS montantVente,

    -- client‑wide remaining balance (independent of fkVente)
    b.totalSales,
    b.totalPayments,
    b.montantRestant,
    ce.solde,

    v.heur,
    v.typeVersement,
    v.fkVente
FROM [TrizDistributionMekahli].[dbo].[versement] v
LEFT JOIN [TrizDistributionMekahli].[dbo].[client] cl ON v.fk_client = cl.id_client
LEFT JOIN [TrizDistributionMekahli].[dbo].[camion] ca ON v.fk_camion  = ca.id_camion
LEFT JOIN CreditCamionClient ce
  ON ce.fk_client       = v.fk_client
 AND ce.fk_camion       = v.fk_camion
 AND ce.fkEtablissement = v.fkEtablissement
LEFT JOIN ClientTruckCounts ctc ON v.fk_client = ctc.fk_client
LEFT JOIN [TrizDistributionMekahli].[dbo].[vente] vt ON v.fkVente   = vt.id_vente
LEFT JOIN Balances b  ON v.fk_client = b.fk_client AND v.fkEtablissement = b.fkEtablissement
WHERE 
v.fkEtablissement = '${etablissementId}'
AND v.[date] BETWEEN '${startDate}' AND '${endDate}'
ORDER BY v.[date];
`
        }
      }
      else if (typeOfData == "RecapVendeur") {
        query = `
 SET DATEFIRST 7; -- الأحد = 1

-- 1. نحسب العملاء المبرمجين
;WITH ProgrammedClients AS (
    SELECT
        fk_secteur,
        COUNT(DISTINCT fk_client) AS ClientsProgrammer
    FROM [TrizDistributionMekahli].[dbo].[secteur_client]
    GROUP BY fk_secteur
),

-- 2. نحسب زيارات بدون بيع
VisitesSans AS (
  SELECT
    vs.date,
    vs.fkCamion            AS fk_camion,
    sc.fk_secteur          AS id_secteur,
    COUNT(DISTINCT vs.fkClient) AS VisitesSansVente
  FROM [TrizDistributionMekahli].[dbo].[VisiteSansVente] vs
  CROSS APPLY (
    SELECT jour = CASE DATEPART(WEEKDAY, vs.date)
      WHEN 7 THEN 1 WHEN 1 THEN 2 WHEN 2 THEN 3 WHEN 3 THEN 4
      WHEN 4 THEN 5 WHEN 5 THEN 6 WHEN 6 THEN 7
    END
  ) AS j
  INNER JOIN [TrizDistributionMekahli].[dbo].[CamionSecteurAffecter] csa 
    ON vs.fkCamion = csa.fk_camion
  INNER JOIN [TrizDistributionMekahli].[dbo].[camion_secteur] cs
    ON cs.fk_camion = csa.fk_camion
   AND cs.fk_secteur = csa.fk_secteur
   AND cs.fk_journee = j.jour
  INNER JOIN [TrizDistributionMekahli].[dbo].[secteur_client] sc
    ON sc.fk_client = vs.fkClient 
   AND sc.fk_secteur = csa.fk_secteur
  WHERE
    vs.date BETWEEN '${startDate}' AND '${endDate}'
    AND vs.fkEtablissement = '${etablissementId}'
  GROUP BY vs.date, vs.fkCamion, sc.fk_secteur
),

-- 3. نحسب زيارات متقاربة زمنياً في أقل من 10 ثوانٍ
FastVisits AS (
  SELECT
    date,
    fkCamion AS fk_camion,
    fk_secteur AS id_secteur,
    COUNT(*) AS VisitsWithin10Sec
  FROM (
    SELECT
      vs.date,
      vs.heur,
      vs.fkCamion,
      sc.fk_secteur,
      LAG(vs.heur) OVER (PARTITION BY vs.fkCamion, vs.date, sc.fk_secteur ORDER BY vs.heur) AS PrevHeur
    FROM [TrizDistributionMekahli].[dbo].[VisiteSansVente] vs
    INNER JOIN [TrizDistributionMekahli].[dbo].[secteur_client] sc ON sc.fk_client = vs.fkClient
    WHERE
      vs.date BETWEEN '${startDate}' AND '${endDate}'
      AND vs.fkEtablissement = '${etablissementId}'
  ) AS t
  WHERE DATEDIFF(SECOND, PrevHeur, heur) <= 30
  GROUP BY date, fkCamion, fk_secteur
)

-- 4. استعلام البيع الكامل
SELECT
DISTINCT
    v.id_vente,
    v.fk_client,
    v.date AS [Date],
    DATENAME(WEEKDAY, v.date) AS [DayName],
    s.Nom_secteur AS [Name],
    v.fk_camion,
    cam.code_camion AS [Camion Name],
    pc.ClientsProgrammer AS [Clients Programmer],
    COUNT(DISTINCT CASE WHEN sc.fk_client IS NOT NULL THEN v.fk_client END) AS [Clients Visiter Programmer],
    COUNT(DISTINCT CASE WHEN sc.fk_client IS NULL THEN v.fk_client END) AS [Clients Visiter Non Programmer],
    pc.ClientsProgrammer - COUNT(DISTINCT CASE WHEN sc.fk_client IS NOT NULL THEN v.fk_client END) AS [Clients Non Visiter],
    ISNULL(vs.VisitesSansVente, 0) AS [VisitsWithoutSale],
    ISNULL(fv.VisitsWithin10Sec, 0) AS [Rapid Succession Visits], -- ✅ العمود الجديد
    MIN(v.heur) AS [FirstHeurVente],
    MAX(v.heur) AS [LastHeurVente],
    v.total AS [Total Vente]
FROM [TrizDistributionMekahli].[dbo].[Vente] v
    CROSS APPLY (
        SELECT 
            jour = 
                CASE DATEPART(WEEKDAY, v.date)
                    WHEN 7 THEN 1
                    WHEN 1 THEN 2
                    WHEN 2 THEN 3
                    WHEN 3 THEN 4
                    WHEN 4 THEN 5
                    WHEN 5 THEN 6
                    WHEN 6 THEN 7
                END
    ) AS j
    INNER JOIN [TrizDistributionMekahli].[dbo].[CamionSecteurAffecter] csa ON v.fk_camion = csa.fk_camion
    INNER JOIN [TrizDistributionMekahli].[dbo].[camion_secteur] cs 
        ON cs.fk_camion = csa.fk_camion 
        AND cs.fk_secteur = csa.fk_secteur 
        AND cs.fk_journee = j.jour
    INNER JOIN [TrizDistributionMekahli].[dbo].[camion] cam ON cam.id_camion = v.fk_camion
    INNER JOIN [TrizDistributionMekahli].[dbo].[secteur] s ON csa.fk_secteur = s.id_secteur
    LEFT JOIN [TrizDistributionMekahli].[dbo].[secteur_client] sc 
        ON s.id_secteur = sc.fk_secteur AND v.fk_client = sc.fk_client
    INNER JOIN ProgrammedClients pc ON s.id_secteur = pc.fk_secteur
    LEFT JOIN VisitesSans vs ON vs.date = v.date AND vs.fk_camion = v.fk_camion AND vs.id_secteur = s.id_secteur
    LEFT JOIN FastVisits fv ON fv.date = v.date AND fv.fk_camion = v.fk_camion AND fv.id_secteur = s.id_secteur
WHERE
    v.date BETWEEN '${startDate}' AND '${endDate}'
    AND v.fkEtablissement = '${etablissementId}'
GROUP BY
    v.id_vente,
    v.fk_client,
    v.date,
    v.total,
    DATENAME(WEEKDAY, v.date),
    v.fk_camion,
    cam.code_camion,
    s.Nom_secteur,
    pc.ClientsProgrammer,
    vs.VisitesSansVente,
    fv.VisitsWithin10Sec
ORDER BY
    v.date, s.Nom_secteur;

                `
      } else if (typeOfData == "RecapRegional") {
        query = `
                SELECT
    v.[id] as id_vente
        , v.[fk_vendeur]
        -- Client Info
      , v.[fk_client] as fkClient
        , cl.raison_social AS clientName

      -- Vente Info
      , v.[date]
      , v.[heur]
      , v.[total]
      , v.[totalAchat]
      , v.[totalTTC]
      , v.[remise]
      , v.[remiseProduit]
      , v.[remise_client]
      , v.[remiseEnPourcentage]
      , v.[appliqueSurProduitRemiser]
      , v.[fkTypeClient]
      , v.[totalPoid]
      , v.[totalPoids]

      -- Produit Info
    -- Produit Info
    ,dv.fk_produit,
    p.nom_produit,
    tc.type_client AS typePrix,
    dv.prix,
    dv.quantite,
    dv.prix * dv.quantite AS CA,
    p.reference,
    dv.remise AS remiseDetail,
    dv.valeurRemise,
    dv.prixChanger,
    dv.prixAchat,
    dv.prixChargement,
    p.colissage_carton,

    -- Family Info
    sf.nom AS nomSousFamille,
    f.Nom_famille AS nomFamille

      
FROM [TrizStockMekahli].[dbo].[stock_vente] v
    LEFT JOIN [TrizStockMekahli].[dbo].[stock_client] cl ON v.fk_client = cl.id
    LEFT JOIN [TrizStockMekahli].[dbo].[stock_detail_vente] dv ON v.id = dv.fk_vente
    LEFT JOIN [TrizStockMekahli].[dbo].[stock_produit] p ON dv.fk_produit = p.id
    LEFT JOIN [TrizStockMekahli].[dbo].[stock_sousfamille] sf ON p.fk_Sousfamille = sf.id
    LEFT JOIN [TrizStockMekahli].[dbo].[stock_famille] f ON sf.fk_famille = f.id
    LEFT JOIN [TrizStockMekahli].[dbo].[stock_type_client] tc ON cl.FK_type_client = tc.id


WHERE v.FKEtablissement = '${etablissementId}'AND v.date BETWEEN '${startDate}' AND '${endDate}'`
      } else if (typeOfData == "ClientInactive") {
        if (ClientInactive == "true") {
          query = `
SELECT DISTINCT
    cl.id_client,
    cl.Nom,
    cl.Adresse,
    cl.Telephone,
    cl.wilaya,
    cm.nomCommune,
    cl.fkEtablissement,
    tc.type_client
FROM [TrizDistributionMekahli].[dbo].[client] cl
INNER JOIN [TrizDistributionMekahli].[dbo].[type_client] tc 
    ON cl.FK_type_client = tc.id_type
INNER JOIN [TrizDistributionMekahli].[dbo].[Commune] cm 
    ON cm.codeCommune = cl.Fkcommune 
WHERE cl.fkEtablissement = '${etablissementId}'
  AND NOT EXISTS (
      SELECT 1 
      FROM [TrizDistributionMekahli].[dbo].[vente] v
      WHERE v.fk_client = cl.id_client
  );


`
        } else {
          query = `
SELECT 
    cl.id_client,
    cl.Nom,
    cl.Adresse,
    cl.Telephone,
    cl.wilaya,
    cm.nomCommune,
    cl.fkEtablissement,
    tc.type_client
FROM [TrizDistributionMekahli].[dbo].[client] cl
INNER JOIN [TrizDistributionMekahli].[dbo].[type_client] tc 
    ON cl.FK_type_client = tc.id_type
INNER JOIN [TrizDistributionMekahli].[dbo].[Commune] cm 
    ON cm.codeCommune = cl.Fkcommune 
WHERE cl.fkEtablissement = '${etablissementId}'
  AND NOT EXISTS (
      SELECT 1 
      FROM [TrizDistributionMekahli].[dbo].[vente] v
      WHERE v.fk_client = cl.id_client
        AND v.[date] BETWEEN '${startDate}' AND '${endDate}'
  );

`
        }
      } else if (typeOfData == "FakePosition") {
        query = `
--DECLARE @targetDate DATE = '2025-04-23';

SELECT
    v.id_vente,
    v.fkEtablissement,
    ca.code_camion,
    v.fk_client,
    c.Nom,
    v.date,
    v.heur,
    v.total,
    v.Position_gps_latitude AS VenteLatitude,
    v.Position_gps_longitude AS VenteLongitude,
    c.Position_gps_latitude AS ClientLatitude,
    c.Position_gps_longitude AS ClientLongitude,
    CASE
      WHEN v.Position_gps_latitude  IS NOT NULL
        AND v.Position_gps_longitude IS NOT NULL
        AND c.Position_gps_latitude  IS NOT NULL
        AND c.Position_gps_longitude IS NOT NULL
      THEN geography::Point(v.Position_gps_latitude, v.Position_gps_longitude, 4326)
             .STDistance(
               geography::Point(c.Position_gps_latitude, c.Position_gps_longitude, 4326)
             )
      ELSE NULL
    END AS DistanceMeters
FROM [TrizDistributionMekahli].[dbo].[vente] AS v
LEFT JOIN [TrizDistributionMekahli].[dbo].[client] AS c
  ON v.fk_client = c.id_client
LEFT JOIN [TrizDistributionMekahli].[dbo].[camion] AS ca
  ON ca.id_camion = v.fk_camion
WHERE v.date BETWEEN '${startDate}' AND '${endDate}' AND v.fkEtablissement = '${etablissementId}' order by DistanceMeters desc
`
      } else if (typeOfData == "ClientVisiterNonProgrammer") {
        console.log("ClientVisiterNonProgrammer")
        query = `
                   SET DATEFIRST 7; -- الأحد = 1

;WITH ProgrammedClients AS (
    SELECT
        fk_secteur,
        COUNT(DISTINCT fk_client) AS ClientsProgrammer
    FROM [TrizDistributionMekahli].[dbo].[secteur_client]
    GROUP BY fk_secteur
)
SELECT
DISTINCT
    v.id_vente,
    v.fk_client,
    v.date AS [Date],
    DATENAME(WEEKDAY, v.date) AS [DayName],
    s.Nom_secteur AS [Name],
    v.fk_camion,
    cam.code_camion AS [Camion Name],
    CASE 
      WHEN sc.fk_client IS NOT NULL THEN 'oui'
      ELSE 'non'
    END AS [ClientProgrammer]
FROM [TrizDistributionMekahli].[dbo].[Vente] v
    -- 👇 نحسب journee المقابل لتاريخ كل vente
    CROSS APPLY (
        SELECT 
            jour = 
                CASE DATEPART(WEEKDAY, v.date)
                    WHEN 7 THEN 1  -- Samedi
                    WHEN 1 THEN 2  -- Dimanche
                    WHEN 2 THEN 3  -- Lundi
                    WHEN 3 THEN 4  -- Mardi
                    WHEN 4 THEN 5  -- Mercredi
                    WHEN 5 THEN 6  -- Jeudi
                    WHEN 6 THEN 7  -- Vendredi
                END
    ) AS j
    INNER JOIN [TrizDistributionMekahli].[dbo].[CamionSecteurAffecter] csa ON v.fk_camion = csa.fk_camion
    INNER JOIN [TrizDistributionMekahli].[dbo].[camion_secteur] cs 
        ON cs.fk_camion = csa.fk_camion 
        AND cs.fk_secteur = csa.fk_secteur 
        AND cs.fk_journee = j.jour
    INNER JOIN [TrizDistributionMekahli].[dbo].[camion] cam ON cam.id_camion = v.fk_camion
    INNER JOIN [TrizDistributionMekahli].[dbo].[secteur] s ON csa.fk_secteur = s.id_secteur
    LEFT JOIN [TrizDistributionMekahli].[dbo].[secteur_client] sc 
        ON s.id_secteur = sc.fk_secteur AND v.fk_client = sc.fk_client
    INNER JOIN ProgrammedClients pc ON s.id_secteur = pc.fk_secteur
WHERE
    v.date BETWEEN '${startDate}' AND '${endDate}'
    AND v.fkEtablissement = '${etablissementId}'
GROUP BY
    v.id_vente,
    v.fk_client,
    v.date,
    v.total,
    DATENAME(WEEKDAY, v.date),
    v.fk_camion,
    cam.code_camion,
    s.Nom_secteur,
    pc.ClientsProgrammer,
    CASE 
      WHEN sc.fk_client IS NOT NULL THEN 'oui'
      ELSE 'non'
    END
ORDER BY
    v.date, s.Nom_secteur;
                `
      }

      const result = await Database.executeSQLQuery(query);
      const result2 = query2 == false ? [] : await Database.executeSQLQuery(query2);
      const result3 = query3 == false ? [] : await Database.executeSQLQuery(query3);
      return res.status(httpStatus.OK).send({ result, result2, result3 });
    } catch (err) {
      console.log(err);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: 'An error occurred while fetching data',
        err
      });
    }
  }
}

module.exports = RtmController;

