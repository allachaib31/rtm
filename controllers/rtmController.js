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
            if (typeOfData == "Commande") {
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
    Tc.[id],
    Tc.[Nom],
    Tc.[Prenom],
    Tc.[Telephone],
    Tc.[adresse],
    Tc.[sold],
    Tc.[nomCommune],
    Tc.[nomWiaya],
    Tc.[codeWilaya],
    Tc.[useStock],
    Tc.[latitude],
    Tc.[longitude]
FROM 
    [TrizDistributionMekahli].[dbo].[TotalCreditClientEtablissementDistribution] AS Tc
LEFT JOIN 
    [TrizDistributionMekahli].[dbo].[client] AS c 
    ON Tc.id = c.id_client
WHERE 
    c.fkEtablissement = '${etablissementId}'
    AND Tc.useStock = 'true';
    `
            } else if (typeOfData == "RecapVendeur"){
                query = `
                    DECLARE @weekday INT;
SET DATEFIRST 7; -- الأحد = 1
SET @weekday = DATEPART(WEEKDAY, '${startDate}');

-- تحويل weekday إلى fk_journee كما في جدول journee
DECLARE @jour INT = 
    CASE @weekday
        WHEN 7 THEN 1  -- Samedi
        WHEN 1 THEN 2  -- Dimanche
        WHEN 2 THEN 3  -- Lundi
        WHEN 3 THEN 4  -- Mardi
        WHEN 4 THEN 5  -- Mercredi
        WHEN 5 THEN 6  -- Jeudi
        WHEN 6 THEN 7  -- Vendredi
    END;

;WITH ProgrammedClients AS (
    SELECT
        fk_secteur,
        COUNT(DISTINCT fk_client) AS ClientsProgrammer
    FROM [TrizDistributionMekahli].[dbo].[secteur_client]
    GROUP BY fk_secteur
)
SELECT
    v.date AS [Date],
    s.Nom_secteur AS [Name],
    v.fk_camion,
    cam.code_camion AS [Camion Name],
    pc.ClientsProgrammer AS [Clients Programmer],
    COUNT(DISTINCT CASE WHEN sc.fk_client IS NOT NULL THEN v.fk_client END) AS [Clients Visiter Programmer],
    COUNT(DISTINCT CASE WHEN sc.fk_client IS NULL THEN v.fk_client END) AS [Clients Visiter Non Programmer],
    pc.ClientsProgrammer - COUNT(DISTINCT CASE WHEN sc.fk_client IS NOT NULL THEN v.fk_client END) AS [Clients Non Visiter]
FROM [TrizDistributionMekahli].[dbo].[Vente] v
    INNER JOIN [TrizDistributionMekahli].[dbo].[CamionSecteurAffecter] csa ON v.fk_camion = csa.fk_camion
    -- نربط مع الجدول اللي فيه fk_journee
    INNER JOIN [TrizDistributionMekahli].[dbo].[camion_secteur] cs ON cs.fk_camion = csa.fk_camion AND cs.fk_secteur = csa.fk_secteur
    INNER JOIN [TrizDistributionMekahli].[dbo].[camion] cam ON cam.id_camion = v.fk_camion -- 👈 الربط مع جدول camion
    INNER JOIN [TrizDistributionMekahli].[dbo].[secteur] s ON csa.fk_secteur = s.id_secteur
    LEFT JOIN [TrizDistributionMekahli].[dbo].[secteur_client] sc ON s.id_secteur = sc.fk_secteur AND v.fk_client = sc.fk_client
    INNER JOIN ProgrammedClients pc ON s.id_secteur = pc.fk_secteur
WHERE
    v.date = '${startDate}' 
    AND v.fkEtablissement = '${etablissementId}'
    -- الفلترة حسب اليوم الحقيقي للتاريخ
    AND cs.fk_journee = @jour
GROUP BY
    v.date,
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
                message: 'An error occurred while fetching data'
            });
        }
    }
}

module.exports = RtmController;

/**
 *  SELECT
        TOP (1000)
            c.id, c.fkEtablissement, e.nomEtablissement , ca.code_camion, 
            cl.id_client as fkClient, cl.Nom, com.nomCommune, c.date, c.heur, c.total, 
            (c.remise) as remise, statusConfirmation, fkVersement, fkStatutCommande, 
            dateLivraison, c.validation,fkTypeCommande,fk_camionLivraison,ValiderPar,
            tauxRemise,remiseProduit, fkCategorieCommande,fk_produit, p.nom_produit,prix_unitaire,
            quantite,prix_unitaire*quantite as CA,c.remise as RemiseP, dc.valeurRemise,
            isfree,prix_changer,isRemiseComposer,fkpack, tc.type_client as TypePrix
        FROM 
            "TrizDistributionMekahli"."dbo".Commande c,
            "TrizDistributionMekahli"."dbo".DetailCommande dc,
            "TrizDistributionMekahli"."dbo".client cl,
            "TrizDistributionMekahli"."dbo".camion ca,
            "TrizDistributionMekahli"."dbo".produit p,
            "TrizDistributionMekahli"."dbo".Sous_famille sf,
            "TrizDistributionMekahli"."dbo".famille f,
            "TrizDistributionMekahli"."dbo".Etablissement e,
            "TrizDistributionMekahli"."dbo".Commune com,
            "TrizDistributionMekahli"."dbo".type_client tc
        WHERE 
            c.fkCamion = ca.id_camion 
            AND c.fkClient = cl.id_client 
            AND c.id = dc.fk_commande 
            AND p.fk_Sousfamille = sf.id_Sousfamille
            AND dc.fk_produit = p.id_produit 
            AND c.fkEtablissement ='31010' 
            AND e.id= c.fkEtablissement 
            AND com.codeCommune = cl.Fkcommune
            AND tc.id_type= c.fk_type_client
            ${dateFilter}
 */