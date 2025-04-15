const { status: httpStatus } = require("http-status");
const Database = require('../config/database');

class RtmController {
    static async geData(req, res) {
        const { startDate, endDate, typeOfData, etablissementId } = req.query;
        console.log(etablissementId)
        try {
            let dateFilter = '';
            if (startDate && endDate) {
                dateFilter = ` AND c.date BETWEEN '${startDate}' AND '${endDate}'`;
            }
            let query;
            if(typeOfData == "CashVan"){
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
    v.remiseProduit,
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
            f.Nom_famille
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
    f.Nom_famille AS nomFamille

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
                query = `
SELECT  
    ce.[id],
    ce.[fkClient],
    c.[Nom] AS [Client Name],
    ce.[fkEtablissement],
    ce.[sold],
    ce.[lastDateCommande],
    ce.[lastDateVersement],
    ce.[lastDateAchat],
    ce.[lastDateVisite],
    ce.[isAchat],
    ce.[lastDateVisiteMerchandising],
    ce.[remiseEnPourcent],
    ce.[consomationRemiseEnPourcent],
    ce.[HaveQrCode],
    ce.[soldLitige],
    ce.[numCommandeClient]
FROM [TrizDistributionMekahli].[dbo].[client_Etablissement] ce
INNER JOIN [TrizDistributionMekahli].[dbo].[client] c 
    ON ce.fkClient = c.id_client
WHERE ce.fkEtablissement = '${etablissementId}'
  AND (ce.sold > 0 OR ce.sold < 0);

    `
            } else if (typeOfData == "RecapVendeur"){
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
    v.date AS [Date],
    DATENAME(WEEKDAY, v.date) AS [DayName],
    s.Nom_secteur AS [Name],
    v.fk_camion,
    cam.code_camion AS [Camion Name],
    pc.ClientsProgrammer AS [Clients Programmer],
    COUNT(DISTINCT CASE WHEN sc.fk_client IS NOT NULL THEN v.fk_client END) AS [Clients Visiter Programmer],
    COUNT(DISTINCT CASE WHEN sc.fk_client IS NULL THEN v.fk_client END) AS [Clients Visiter Non Programmer],
    pc.ClientsProgrammer - COUNT(DISTINCT CASE WHEN sc.fk_client IS NOT NULL THEN v.fk_client END) AS [Clients Non Visiter],
    MIN(v.heur) AS [FirstHeurVente],
    MAX(v.heur) AS [LastHeurVente],
    v.total AS [Total Vente]  -- 👈 هذا السطر الجديد لحساب مجموع total لكل يوم ولكل camion
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
    v.date,
    v.total,
    DATENAME(WEEKDAY, v.date),
    v.fk_camion,
    cam.code_camion,
    s.Nom_secteur,
    pc.ClientsProgrammer
ORDER BY
    v.date, s.Nom_secteur;

                `
            }

            const result = await Database.executeSQLQuery(query);
            return res.status(httpStatus.OK).send({ result });
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


/**
 * SET DATEFIRST 7; -- الأحد = 1

;WITH ProgrammedClients AS (
    SELECT
        fk_secteur,
        COUNT(DISTINCT fk_client) AS ClientsProgrammer
    FROM [TrizDistributionMekahli].[dbo].[secteur_client]
    GROUP BY fk_secteur
)
SELECT
    v.date AS [Date],
    DATENAME(WEEKDAY, v.date) AS [DayName],
    s.Nom_secteur AS [Name],
    v.fk_camion,
    cam.code_camion AS [Camion Name],
    pc.ClientsProgrammer AS [Clients Programmer],
    COUNT(DISTINCT CASE WHEN sc.fk_client IS NOT NULL THEN v.fk_client END) AS [Clients Visiter Programmer],
    COUNT(DISTINCT CASE WHEN sc.fk_client IS NULL THEN v.fk_client END) AS [Clients Visiter Non Programmer],
    pc.ClientsProgrammer - COUNT(DISTINCT CASE WHEN sc.fk_client IS NOT NULL THEN v.fk_client END) AS [Clients Non Visiter],
    MIN(v.heur) AS [FirstHeurVente],
    MAX(v.heur) AS [LastHeurVente],
    SUM(v.total) AS [Total Vente]  -- 👈 هذا السطر الجديد لحساب مجموع total لكل يوم ولكل camion
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
    v.date,
    DATENAME(WEEKDAY, v.date),
    v.fk_camion,
    cam.code_camion,
    s.Nom_secteur,
    pc.ClientsProgrammer
ORDER BY
    v.date, s.Nom_secteur;

 */