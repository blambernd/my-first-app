import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";

interface MemberInviteEmailProps {
  vehicleName: string;
  role: string;
  inviteUrl: string;
  expiresAt: string;
}

export function MemberInviteEmail({
  vehicleName,
  role,
  inviteUrl,
  expiresAt,
}: MemberInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {`Du wurdest als ${role} für ${vehicleName} eingeladen`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Einladung zum Fahrzeug</Heading>

          <Text style={text}>
            Du wurdest eingeladen, auf das folgende Fahrzeug zuzugreifen:
          </Text>

          <Section style={vehicleBox}>
            <Text style={vehicleText}>{vehicleName}</Text>
            <Text style={roleText}>Rolle: {role}</Text>
          </Section>

          <Text style={text}>
            Klicke auf den Button, um die Einladung anzunehmen.
            Der Link ist bis zum{" "}
            <strong>
              {new Date(expiresAt).toLocaleDateString("de-DE")}
            </strong>{" "}
            gültig.
          </Text>

          <Section style={buttonSection}>
            <Button style={button} href={inviteUrl}>
              Einladung annehmen
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footerText}>
            Falls du diese Einladung nicht erwartet hast, kannst du diese
            E-Mail ignorieren.
          </Text>

          <Text style={footerText}>
            <Link href={inviteUrl} style={link}>
              {inviteUrl}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "8px",
  maxWidth: "480px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "600" as const,
  color: "#1a1a1a",
  margin: "0 0 24px",
};

const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#4a4a4a",
  margin: "0 0 16px",
};

const vehicleBox = {
  backgroundColor: "#f0f4f8",
  borderRadius: "6px",
  padding: "16px",
  margin: "0 0 24px",
};

const vehicleText = {
  fontSize: "17px",
  fontWeight: "600" as const,
  color: "#1a1a1a",
  margin: "0 0 4px",
  textAlign: "center" as const,
};

const roleText = {
  fontSize: "14px",
  color: "#6a6a6a",
  margin: "0",
  textAlign: "center" as const,
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const button = {
  backgroundColor: "#0f172a",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "500" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  borderRadius: "6px",
  padding: "12px 32px",
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "24px 0",
};

const footerText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#8a8a8a",
  margin: "0 0 8px",
};

const link = {
  color: "#0066cc",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
};

export default MemberInviteEmail;
